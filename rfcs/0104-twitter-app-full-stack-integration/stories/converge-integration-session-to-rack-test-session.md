---
title: "Drive Integration::Session through the app stack instead of a hand-rolled controller dispatch"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Integration::Session#process`
(`vendor/rails/actionpack/lib/action_dispatch/testing/integration.rb:225-305`)
drives a request by building a Rack env and handing it to the **app**, through
`Rack::Test::Session`, so everything the real stack does — middleware, session
store commit, cookie round-trip — happens for real:

```ruby
@integration_session = Rack::Test::Session.new(_mock_session)
...
response = _mock_session.last_response
```

trails' `packages/actionpack/src/action-dispatch/testing/integration.ts`
instead hand-rolls the dispatch loop: it looks the controller up in a local
registry, instantiates it, calls `controller.dispatch(...)` directly, and then
copies session and cookie state in and out around that call. No middleware runs
and no session store is involved.

Two reviewers on PR #7317 flagged this as a pre-existing structural deviation
(explicitly "noted, not re-litigated"), and it is the reason that PR had to add
compensating machinery: because `Metal#dispatch` now runs `request.commit_flash`
(`metal.rb:249-255`), which can DELETE the session's `flash` key, the harness
needed a `sessionSeed` snapshot and a key-deletion sweep to propagate that
delete back into its plain-object session — logic with no Rails counterpart
that exists only because no store's `commit_session` runs.

This is the root deviation under several smaller ones, including why
`cookie-store-runnable-in-a-real-stack` cannot be tested end to end today.

## Converged shape

`Integration::Session` drives the app the way Rails does — env in, Rack response
out, through the application's middleware stack — so that:

- the session store's `commit_session`
  (`vendor/rack-session/lib/rack/session/abstract/id.rb:381-414`) runs and owns
  session persistence, deleting the harness's seed/sweep code;
- the cookie jar round-trips through real `Set-Cookie` headers rather than the
  harness copying fields;
- `flash` survives a redirect because the store persisted it, not because the
  harness carried a hash forward.

Depends on `cookie-store-runnable-in-a-real-stack` (a runnable store) and on
`port-setup-default-session-store` (something to put in the stack).

## Acceptance criteria

- `Integration::Session#process` calls the app rather than a controller
  instance, at `integration.rb:225-305`.
- `sessionSeed` / the committed-key deletion sweep are deleted from
  `integration.ts`.
- The existing flash-across-a-redirect test passes unchanged, now driven by a
  real session store rather than harness bookkeeping.

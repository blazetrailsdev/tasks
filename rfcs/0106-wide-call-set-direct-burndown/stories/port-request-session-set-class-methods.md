---
title: "Port Request::Session.set / Session::Options.set and route the writers through them"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6675
claim: "2026-08-17T23:07:59Z"
assignee: "admit-first-to-receiver-as-first-arg"
blocked-by: null
closed-reason: null
---

# Port Request::Session.set / Session::Options.set and route the writers through them

## Context

Rails' request session writers delegate to class methods on the session types
(actionpack/lib/action_dispatch/http/request.rb:386-392):

```ruby
def session=(session)          Session.set self, session          end
def session_options=(options)  Session::Options.set self, options end
```

`Session.set` / `Session::Options.set`
(actionpack/lib/action_dispatch/request/session.rb) are what own the env keys
(`rack.session`, `rack.session.options`). trails' setters
(packages/actionpack/src/action-dispatch/http/request.ts) write those env keys
inline because neither class method is ported, so the delegation Rails has is
absent and the env-key knowledge is duplicated at the call site.

Surfaced by RFC 0106 wave 3, which recorded the gap as per-row justifications on
`session= | set` and `session_options= | set` in
`call-mismatches-exclude/actiondispatch/http/request.json`.

## Converged shape

Port `Session.set` and `Session::Options.set` at their Rails names in
`request/session.ts`, and reduce both writers to the single delegating call.
Then delete the two rows by hand via `serializeBaseline` and lower the mark with
`pnpm parity:api:calls:tighten actiondispatch/http/request.json`.

## Acceptance criteria

- [ ] `Session.set` / `Session::Options.set` exist at the Rails names and own
      the env writes.
- [ ] Both `set` rows deleted; gate green, no `--write`.

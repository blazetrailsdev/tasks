---
title: "request-env-by-reference"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6701
claim: "2026-08-18T14:06:53Z"
assignee: "request-env-by-reference"
blocked-by: null
closed-reason: null
---

# Make `ActionDispatch::Request` hold its Rack env by reference

## Context

Split out of `0108-call-gate-false-positives/converge-remaining-call-arg-shape-rows`
(PR #TBD), which found this row genuinely blocked and recorded the blocker in the
baseline reason.

`host_authorization.rb:167` is:

    def mark_as_authorized(request)
      request.set_header("action_dispatch.authorized_host", request.host)
    end

The write goes straight into the env the downstream app receives. trails'
`Request` COPIES the Rack env it is constructed from, so a `setHeader` on the
throwaway `new Request(env)` built at
`packages/actionpack/src/action-dispatch/middleware/host-authorization.ts:250`
would never reach the app. The port therefore threads the raw `env` alongside the
request (`markAsAuthorized(env, request)`, host-authorization.ts:284), and the
same clone forces `isExcluded(env)` (host-authorization.ts:277) to take the env
rather than the request Rails passes (`excluded?(request)`, host_authorization.rb:163).

Both divergences are baselined in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/middleware/host-authorization.json`.
Neither can converge until `Request` holds the env by reference, which is the
Rack semantics Rails relies on throughout (every `set_header` in
`action_dispatch/http/**` is a mutation the next middleware observes).

## Acceptance criteria

- [ ] `ActionDispatch::Request` holds the Rack env it was constructed from by
      reference, so `request.setHeader(...)` is visible to downstream middleware
      (matching `Rack::Request::Env`).
- [ ] `HostAuthorization#markAsAuthorized` takes only `request` and writes via
      `request.setHeader`, and `isExcluded` takes `request`, matching
      host_authorization.rb:163,167.
- [ ] Both rows in
      `call-mismatches-exclude/actiondispatch/middleware/host-authorization.json`
      are DELETED by hand (only-shrink; no reseed), the unreviewed mark tightened.
- [ ] `pnpm parity:api:calls` / `:args` green; actionpack tests pass.

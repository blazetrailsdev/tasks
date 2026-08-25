---
title: "converge-actiondispatch-request-env-clone-to-rack-shared-env"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of 0108-call-gate-false-positives/request-env-by-reference, which was filed the same day for the same Request env clone (http/request.ts:157) and is already claimed."
---

## Context

`ActionDispatch::Request#initialize` in Rails keeps the Rack env it is handed —
`Rack::Request::Env#initialize` is `@env = env` — so anything a request writes
through `set_header` is visible to the middleware that owns that env and to
everything downstream in the stack.

trails' port CLONES instead
(`packages/actionpack/src/action-dispatch/http/request.ts:157`,
`this.env = { ...env }`, followed by a block of `??=` defaults Rack does not
apply either). Two consequences are already measured:

- `actiondispatch/middleware/host-authorization.ts` cannot port
  `mark_as_authorized(request)` (`host_authorization.rb:167-168`,
  `request.set_header("action_dispatch.authorized_host", request.host)`) — the
  header would land on the clone and never reach the app. The port threads the
  raw env alongside the request (`markAsAuthorized(env, request)`), which is the
  one call-argument shape row left in
  `call-mismatches-exclude/actiondispatch/middleware/host-authorization.json`.
  `isExcluded(env)` has the same cause and shows as a report-only `naming` row.
- Any other ported body that writes a header through a `Request` it constructed
  is silently a no-op for its caller.

Deciding this is deliberately out of scope for the call-arg burndown PR that
found it (#PR): dropping the clone changes what `new Request(env)` does for every
caller in actionpack, including the `??=` defaults, which would then mutate the
caller's env.

## Acceptance criteria

- [ ] `Request` shares the env it is constructed with, as Rack does, or the
      divergence is written up with the specific reason it cannot.
- [ ] The `??=` defaults are either justified against Rack's own behaviour or
      removed with it.
- [ ] `host-authorization.ts` ports `mark_as_authorized(request)` /
      `excluded?(request)` at Rails' argument shape, and their rows are deleted
      from `call-mismatches-exclude/actiondispatch/middleware/host-authorization.json`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.

---
title: "converge-controller-session-delegation"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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
closed-reason: null
---

## Context

`ActionController::Metal` in Rails is `delegate :session, to: "@_request"`
(`vendor/rails/actionpack/lib/action_controller/metal.rb:176`). trails keeps
a per-controller plain object instead:

- `packages/actionpack/src/action-controller/base.ts:195` —
  `session: Record<string, unknown> = {}`.

PR for `session-and-flash-lifecycle` converged the FLASH half
(`Base#flash` is now `get flash() { return this.request.flash! }`, mirroring
`delegate :flash, to: :request`, `action_controller/metal/flash.rb:12`) but
backed the session half out, because `ActionDispatch::Request#session`
answers an `ActionDispatch::Request::Session` whose reads and writes are
`get(k)` / `set(k, v)`, not `session.foo`. Delegating today reds every
`session.userId = 1` call site plus the CSRF module, which takes a
`Record<string, unknown>`:

- `packages/actionpack/src/action-dispatch/request-forgery-protection.ts:68,91,126,194,234,267,276`
  all type `session` as a plain hash.
- ~15 test call sites across
  `action-controller/controller/test-case.test.ts`,
  `action-controller/controller/action-pack-assertions.test.ts` and
  `action-dispatch/testing/integration.test.ts`.

Rails' `Session` supports `session[:key]` because Ruby has `[]`/`[]=`; the
TS spelling is `get`/`set`, so every call site moves.

## Acceptance criteria

- `Metal#session` is `get session() { return this.request.session; }`, at
  `metal.rb:176`, and the `session` instance field on
  `ActionController::Base` is deleted.
- `RequestForgeryProtection`'s `session` parameters take the
  `ActionDispatch::Request::Session` surface rather than a plain hash.
- Every call site moves to `session.get(...)` / `session.set(...)`.
- The `converge-controller-session-delegation` pointer in the JSDoc at
  `action-controller/base.ts` is removed with the field.

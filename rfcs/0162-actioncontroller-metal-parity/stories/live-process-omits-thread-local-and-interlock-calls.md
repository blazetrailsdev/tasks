---
title: "Live#process omits Rails' thread-local, interlock and execution-state calls"
status: in-progress
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8593
claim: "2026-10-06T19:03:14Z"
assignee: "marshalling-methods-bodies-are-not-arm-compared"
blocked-by: null
closed-reason: null
---

## Context

trails#8557 converted `ActionController::Live` to a `Module` and gave `process(name)` Rails' signature (`packages/actionpack/src/action-controller/metal/live.ts`). The body still omits calls `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:276-323` makes, with no `@missingRailsCall` receipt:

- `locals = t1.keys.map { |key| [key, t1[key]] }` and `locals.each { |k, v| t2[k] = v }` (`:277-278,290`); `clean_up_thread_locals(locals, t2)` (`:311`) is called as `cleanUpThreadLocals([], null)`.
- `ActiveSupport::Dependencies.interlock.running` (`:285`) and `permit_concurrent_loads` (`:318`).
- `ActiveSupport::IsolatedExecutionState.share_with(t1)` (`:291`) and `.clear` (`:310`).
- `new_controller_thread` drops `t2.abort_on_exception = true` (`:377-383`). It posts the block with `void liveThreadPoolExecutor().post(block)`, so a throw from the block's `ensure` arm (`commit!`) is an unhandled rejection and `await_commit` never resolves.

Also `Response#await_sent` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:203-205`) is still an empty stub in `action-dispatch/http/response.ts`, and `commit!` / `await_commit` (`:197-213`) take no `synchronize`.

`LiveHeadRenderTest#setup`'s `response_body=` override (`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:995-998`) is ported without its `sleep 0.1` (maintainer sign-off on trails#8557: a JS setter cannot suspend).

## Acceptance criteria

- [ ] Each omitted call is ported, or carries a `@missingRailsCall <name> — PERMANENT|CONVERGEABLE <story-id>` receipt on `process` / `newControllerThread`; `pnpm parity:api:calls` stays green.
- [ ] `IsolatedExecutionState.share_with` / `clear` are ported if `packages/activesupport/src/isolated-execution-state.ts` has them.
- [ ] A throw inside the controller-thread block surfaces as Rails' `abort_on_exception` does, not as an unhandled rejection with a hung `await_commit`.
- [ ] `awaitSent` waits on `sentBang`'s broadcast, as `await_commit` now waits on `commitBang`'s.

---
title: "Let a Kernel#throw from a controller action pass actionpack's rescue layers"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-wiring
packages: ["actionpack"]
deps: ["port-kernel-catch-throw"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`env["warden"].authenticate!` inside a controller action is
`throw(:warden, opts)` (`vendor/warden/v1.2.9/lib/warden/proxy.rb:134`), caught
by `Manager#call` several middleware above the controller. In Ruby a `throw`
is not an exception, so every `rescue Exception` between the two
(`ActionDispatch::ShowExceptions#call`,
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb:31-36`;
`DebugExceptions#call`, `debug_exceptions.rb:31-41`; `Executor#call`,
`executor.rb:13-31`; `Callbacks#call`, `callbacks.rb:24-33`;
`ActionController::Rescue#process_action`, `metal/rescue.rb:28-32`) lets it
through untouched, running only `ensure` bodies.

In trails a JS `catch` sees the in-flight throw. ruby-compat answers that with
`throwDataP` (`packages/ruby-compat/src/kernel-catch.ts:77`, MRI
`THROW_DATA_P`): a ported `rescue` asks it and re-throws. As of 2026-11-03
none of these files calls it: `show-exceptions.ts` has 4 `catch` clauses,
`debug-exceptions.ts` 2, `executor.ts` 1, `callbacks.ts` 1,
`action-controller/metal/rescue.ts:23` 1, and `throwDataP` appears in none
(only `action-controller/metal/instrumentation.ts`). So today a
`kernelThrow("warden")` from an action would be rendered as a 500 by
`ShowExceptions` instead of reaching warden. `:abort` never surfaced this
because it is caught inside the callback chain.

This is an existing actionpack gap that warden is the first to hit, which is
why it is filed here with an `actionpack` package tag.

## Acceptance criteria

- Each `catch` on the request path between a controller action and the outer
  middleware either re-throws when `throwDataP(e)` or is shown not to see one;
  `instrumentation.ts`'s use is the shape.
- A `.trails.test.ts` in actionpack: an action that calls
  `kernelThrow("warden", { … })` inside a stack wrapped in
  `kernelCatch("warden", …)` reaches the catch with the value, with
  `ShowExceptions` and `DebugExceptions` in the stack, and `ensure` bodies
  (`Executor`'s completion) still run.
- The call gates are unchanged or shrink.

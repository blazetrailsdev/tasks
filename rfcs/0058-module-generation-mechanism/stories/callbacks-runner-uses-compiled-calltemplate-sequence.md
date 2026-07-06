---
title: "Callback runner should drive the compiled CallTemplate/CallbackSequence instead of bespoke _invoke"
status: ready
updated: 2026-07-06
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails' callback execution diverges architecturally from Rails. Rails compiles a
callback chain into a nested `CallbackSequence` of lambdas
(`ActiveSupport::Callbacks::CallbackChain#compile` →
`CallTemplate#make_lambda` / `#expand`, run via `invoke_before`/`invoke_after`),
and that compiled sequence IS what executes at runtime.

trails instead has `CallbackChain._invoke`
(`packages/activesupport/src/callbacks.ts` ~line 745) reimplement the entire
before/around/after run loop by hand — calling `entry.filter` directly with
hand-rolled `this`-binding, terminator handling, and around continuation logic.
The faithful structural port of Rails (`CallTemplate` subclasses,
`CallbackSequence`, the `Callback#compiled` getter, `makeLambda`/`invertedLambda`/
`expand`) is **dead code**: confirmed during PR #3493 that `.compiled`,
`CallbackSequence.before/after/around`, `invokeBefore`, and `expandCallTemplate`
have zero callers outside their own definitions, and `CallbackSequence.invoke`
short-circuits straight to `_invoke`.

Consequences:

- Execution architecture does not match Rails.
- Fidelity fixes made to the CallTemplate layer (e.g. PR #3493's instance_exec
  `this`-binding and `InstanceExec2` block-threading) are unexercised at runtime —
  only the parallel `_invoke` hand-port enforces them.
- Two code paths (the compiled layer and `_invoke`) must be kept in sync by hand;
  they have already drifted (the block channel exists in `expand`/`makeLambda`
  but `_invoke` passes the around continuation positionally).

## Acceptance criteria

- [ ] Decide convergence target: either (a) make `CallbackChain.compile()` build
      a real `CallbackSequence` from the `CallTemplate`s and have
      `CallbackSequence.invoke` run it (retiring the bespoke `_invoke` loop), or
      (b) if convergence is out of scope, delete the dead CallTemplate/
      CallbackSequence layer so there is a single source of truth.
- [ ] If converging: the compiled sequence drives before/around/after with the
      same terminator, halt, async, and skip-after-if-terminated semantics
      `_invoke` currently provides; existing callback tests stay green.
- [ ] Behavior matches Rails; no test renamed.

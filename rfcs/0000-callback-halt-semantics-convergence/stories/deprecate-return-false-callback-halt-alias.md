---
title: "Converge callback halt to throw-abort sentinel only (drop return-false alias)"
status: done
updated: 2026-06-20
rfc: "0000-callback-halt-semantics-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3700
claim: "2026-06-20T03:10:43Z"
assignee: "deprecate-return-false-callback-halt-alias"
blocked-by: null
---

## Context

Follow-up to `callback-abort-sentinel-control-flow` (PR #3596), which added the
faithful Rails-5 abort sentinel (`throwAbort()` / `isAbortSignal`) caught by the
default-terminator path in `packages/activesupport/src/callbacks.ts`
(`_invoke`) and by the association before_add/before_remove paths
(`fireAssocCallbacks` + collection-association `callback()`).

That PR deliberately KEPT `return false` as a documented supported alias for
halting (Rails <=4 behavior) alongside the sentinel, to preserve ergonomics and
avoid churning every existing halt site at once. Modern Rails (5+) ignores a
`false` return entirely — the default terminator halts ONLY on `throw :abort`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb`#default_terminator).
So trails currently has TWO halt mechanisms where Rails has one; the
`return false` path is a tracked, documented deviation pending convergence.

Key sites:

- `packages/activesupport/src/callbacks.ts` `_invoke` default path
  (`cbResult === false`) and `Before.build`/`haltedLambda`
  (`fn() === false`).
- `packages/activerecord/src/associations.ts` `fireAssocCallbacks` and
  `collection-association.ts` `callback()` (`(cb)(...) === false`).
- All fixtures/tests still using `return false` / `() => false` to halt.

## Acceptance criteria

- [ ] Decide the convergence target: drop `return false` halting so only the
      sentinel halts (full Rails-5 parity), OR formally retain it as an
      intentional ergonomic extension with a single documented rationale.
- [ ] If dropping: convert remaining `return false` halt sites (fixtures +
      tests) to `throwAbort()`, remove the `=== false` halt branches, keep the
      sentinel as the sole mechanism; tests still match Rails names.
- [ ] No test renamed; behavior matches Rails default_terminator.

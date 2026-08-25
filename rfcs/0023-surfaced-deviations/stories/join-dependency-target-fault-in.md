---
title: "Fault in the join planner's target model instead of relying on checkValidityBang ordering"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: join-dependency.ts:308 resolves the target via reflection.klass; the bare modelRegistry.get reads and the null returns cited at :344/:371 no longer exist."
---

## Context

Raised in review of PR #5503 (converge-ar-model-resolution-onto-constantize).

`JoinDependency` resolves an association's target model with a bare registry
read and no fault-in:

- `packages/activerecord/src/associations/join-dependency.ts:344` —
  `targetModel = modelRegistry.get(className); if (!targetModel) return null;`
- same shape at `:371`.

A `null` return here becomes the misleading
`Association named '<name>' was not found on <Model>; perhaps you misspelled
it?` `ArgumentError` (`relation/query-methods.ts:1708`) even though the
association _is_ declared — the misspelling arm (`ConfigurationError`) is
correctly skipped because `_associations` contains it, so the surfaced error
blames the association name for what is really an unresolved target class.

Today these two sites work only by **ordering**: `addAssociation`
(`join-dependency.ts:307`) calls `checkValidityBang()` first, which goes
`klass` → `computeClass` → `autoloadModel`, and that is what populates
`modelRegistry` before `:344` reads it. Registry population is therefore a side
effect of validity checking rather than something the join planner does for
itself. Any path reaching `:344` without a reflection — e.g. the auto-generated
HABTM middle definition, where `_reflectOnAssociation` misses — gets no
fault-in and silently returns `null`.

PR #5503 hit the consequence of the same asymmetry from the other direction:
gating `autoloadModel` on `safeConstantize` rather than `modelRegistry` skipped
the fault-in and broke `Topic.joins("replies")` (`calculations.test.ts:1523`,
`:1535`). That was fixed by restoring the registry gate, which leaves this
ordering dependency intact but unaddressed.

## Acceptance criteria

- `join-dependency.ts:344` and `:371` fault the target in themselves —
  `autoloadModel(className)` then a constant lookup — so they do not depend on
  `checkValidityBang` having run first.
- A reflection-less path (HABTM middle definition, or a direct
  `constructJoinDependency` on a model whose target is index-only) resolves its
  target; covered by a test that fails on baseline.
- When the target genuinely cannot be resolved, the surfaced error names the
  unresolved _class_, not "association not found" — or the reason for keeping
  the current shape is recorded at the call site.
- Related: `converge-model-constant-registration-paths` unifies the three
  writers of the constant table; this story is about the _readers_, and the two
  can land independently.

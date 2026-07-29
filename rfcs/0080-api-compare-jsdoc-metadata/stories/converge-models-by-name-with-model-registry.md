---
title: "Converge _modelsByName with modelRegistry or retire it"
status: done
updated: 2026-07-29
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5617
claim: "2026-07-29T22:53:10Z"
assignee: "converge-models-by-name-with-model-registry"
blocked-by: null
closed-reason: null
---

## Context

Found in review of PR #5511 (converge-model-constant-registration-paths), which
converged the constant table onto `ModelRegistry` but deliberately left the
third map alone.

`Base._modelsByName` still drifts from `modelRegistry` in both directions:

- `registerModel` writes it (`packages/activerecord/src/associations.ts:379,387`)
  and `Base.adapter=` writes it (`packages/activerecord/src/base.ts:1356`), but
  `ModelRegistry.delete`/`clear` (`associations.ts:251-271`) never remove from
  it — they only unregister the constant.
- `packages/activerecord/src/test-helpers/test-adapter.ts:252` clears
  `Base._modelsByName` alone, touching neither the registry nor the constants.

So a name can be absent from the registry and the constant table yet still
resolve through `_modelsByName`, or vice versa. #5511's `registerModelConstant`
docblock (`associations.ts:307-333`) is deliberately narrowed to claim only
registry⇒constant for this reason.

Decide whether `_modelsByName` is redundant with `modelRegistry` (in which case
retire it) or genuinely distinct (in which case fold it into `delete`/`clear`
and re-point the `test-adapter.ts` teardown).

## Acceptance criteria

- `_modelsByName` is either retired in favour of `modelRegistry`, or kept and
  torn down symmetrically by `ModelRegistry.delete`/`clear`.
- `test-helpers/test-adapter.ts:252` no longer clears one map in isolation.
- The narrowed claim in `registerModelConstant`'s docblock is widened to cover
  all three maps, or the remaining asymmetry is recorded there.
- A test covers the teardown direction that is currently unenforced.

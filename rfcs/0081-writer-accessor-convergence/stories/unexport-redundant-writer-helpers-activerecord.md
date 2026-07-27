---
title: "Unexport activerecord writer helpers whose accessor already exists"
status: claimed
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: "2026-07-27T01:57:10Z"
assignee: "unexport-redundant-writer-helpers-activerecord"
blocked-by: null
closed-reason: null
---

## Context

Shape 1 of the RFC: the Rails-named `static set x` accessor already exists and
delegates to an exported `setX` helper, so the helper is redundant PUBLIC
surface — unexporting it removes the extra-surface entry with no behavior
change.

activerecord members (6):

| helper                      | file                    | accessor                     |
| --------------------------- | ----------------------- | ---------------------------- |
| `setAbstractClass`          | `inheritance.ts`        | `abstract_class=`            |
| `setLockOptimistically`     | `locking/optimistic.ts` | `lock_optimistically=`       |
| `setLockingColumn`          | `locking/optimistic.ts` | `locking_column=`            |
| `setSignedIdVerifierSecret` | `signed-id.ts`          | `signed_id_verifier_secret=` |
| `setGeneratedTokenVerifier` | `token-for.ts`          | `generated_token_verifier=`  |
| `setTokenDefinitions`       | `token-for.ts`          | `token_definitions=`         |

## Acceptance criteria

- Each helper is module-private (or, where the module-mixin install site needs
  it, marked `@internal`) and removed from any barrel/index re-export.
- The existing `static set` accessor keeps working; existing tests pass
  unchanged; no call site switches to a different spelling.
- `pnpm api:extra` reports 6 fewer extras for activerecord with no new stale
  entries, and `pnpm api:compare` still matches the `foo=` writers.

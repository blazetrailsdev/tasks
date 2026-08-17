---
title: "Burn down the naming call-argument rows in activerecord relation, scoping and statement-cache"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6619
claim: "2026-08-16T22:56:16Z"
assignee: "activemodel-instance-validates-with"
blocked-by: null
closed-reason: null
---

## Context

One of the seven clusters `wave-4-cluster-remaining-naming-rows` split the RFC
0096 naming residue into, so that `naming-gate-flip` has a checkable
precondition rather than a judgement call. Measured 2026-08-14 from a full
`pnpm build`, `API_COMPARE_FORCE=1 pnpm parity:api --calls`, then
`pnpm parity:api:calls:args:report`: 108 in-scope `class: "naming"` rows
survive, 37 of them in the permanent classes of
`scripts/api-compare/naming-taxonomy.ts` and 71 as burndown work. This story
owns **11** of those 71.

Every row here is `class: "burndown"`: a local or parameter that simply is not carrying its Rails identifier, camelCased. That is free fidelity — rename it to what the Ruby calls it. Read the Rails body in `vendor/rails/` first and cite `gem/path.rb:LINE` for each rename; a handful of rows are recorder shape (a chained or nested call the recorder attributes to the wrong callee) and those are reported in the PR body with the Ruby `file:line`, not converged and not baselined.

| File                                         | Method                     | Call                       | Differing identifiers                |
| -------------------------------------------- | -------------------------- | -------------------------- | ------------------------------------ |
| `activerecord/relation/batches.ts`           | `batchOnLoadedRelation`    | `compare_values_for_order` | Array -> finishArr                   |
| `activerecord/relation/batches.ts`           | `batchOnLoadedRelation`    | `compare_values_for_order` | Array -> startArr                    |
| `activerecord/relation/calculations.ts`      | `executeSimpleCalculation` | `aggregate_column`         | columnName -> aggregateTarget        |
| `activerecord/relation/predicate-builder.ts` | `groupingQueries`          | `new`                      | queries -> constructor               |
| `activerecord/relation/query-methods.ts`     | `buildArel`                | `distinct`                 | distinctValue -> \_isDistinct        |
| `activerecord/relation/query-methods.ts`     | `buildCastValue`           | `with_cast_value`          | defaultValue -> constructor          |
| `activerecord/relation/query-methods.ts`     | `buildJoinBuckets`         | `new`                      | sql -> arelSql                       |
| `activerecord/relation/query-methods.ts`     | `buildWithValueFromHash`   | `new`                      | buildWithExpressionFromValue -> expr |
| `activerecord/relation/query-methods.ts`     | `flattenedArgs`            | `flattened_args`           | toA -> e                             |
| `activerecord/scoping/default.ts`            | `buildDefaultScope`        | `scope`                    | scopeObj -> rel                      |
| `activerecord/statement-cache.ts`            | `create`                   | `new`                      | binds -> sql                         |

## Acceptance criteria

- [ ] Locals and parameters in the files above carry the Rails identifier, camelCased,
      with the Rails `file:line` cited for each.
- [ ] `pnpm parity:api:calls:args:report` shows the in-scope `naming` count down
      by the rows converged here, and no new `shape` rows.
- [ ] No baseline row is added, widened or reseeded; `naming` stays report-only
      until `naming-gate-flip`.
- [ ] Any row left standing is named in the PR body with its reason and, when it
      is a real defect rather than recorder shape, the follow-up story it was
      filed against.

---
title: "Burn down the naming call-argument rows in the activerecord PostgreSQL adapter and its OID types"
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

| File                                                                 | Method        | Call                  | Differing identifiers                                                                          |
| -------------------------------------------------------------------- | ------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `activerecord/connection-adapters/postgresql-adapter.ts`             | `explain`     | `pp`                  | result -> toArray                                                                              |
| `activerecord/connection-adapters/postgresql-adapter.ts`             | `removeIndex` | `quote_table_name`    | indexToRemove -> toString                                                                      |
| `activerecord/connection-adapters/postgresql-adapter.ts`             | `removeIndex` | `quote_table_name`    | indexToRemove -> toString                                                                      |
| `activerecord/connection-adapters/postgresql-adapter.ts`             | `renameTable` | `pk_and_sequence_for` | newName -> renamedName                                                                         |
| `activerecord/connection-adapters/postgresql-adapter.ts`             | `renameTable` | `pk_and_sequence_for` | newName -> renamedName                                                                         |
| `activerecord/connection-adapters/postgresql/database-statements.ts` | `castResult`  | `new`                 | fields -> columnNames; values -> rows; freeze -> columnTypes                                   |
| `activerecord/connection-adapters/postgresql/oid/array.ts`           | `deserialize` | `type_cast_array`     | decode -> value                                                                                |
| `activerecord/connection-adapters/postgresql/oid/array.ts`           | `serialize`   | `new`                 | pgEncoder -> this; castedValues -> typeCastArray                                               |
| `activerecord/connection-adapters/postgresql/oid/point.ts`           | `buildPoint`  | `new`                 | Float -> fx; Float -> fy                                                                       |
| `activerecord/connection-adapters/postgresql/oid/range.ts`           | `map`         | `new`                 | newBegin -> block; newEnd -> block; exclude_end? -> excludeEnd                                 |
| `activerecord/connection-adapters/postgresql/oid/range.ts`           | `serialize`   | `new`                 | from -> typeCastSingleForDatabase; to -> typeCastSingleForDatabase; exclude_end? -> excludeEnd |

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

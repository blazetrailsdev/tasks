---
title: "Burn down the naming call-argument rows in arel, i18n, globalid and did-you-mean"
status: done
updated: 2026-08-16
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["arel", "i18n", "globalid"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6584
claim: "2026-08-15T23:15:04Z"
assignee: "wave-2-relation-family"
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
owns **13** of those 71.

Every row here is `class: "burndown"`: a local or parameter that simply is not carrying its Rails identifier, camelCased. That is free fidelity — rename it to what the Ruby calls it. Read the Rails body in `vendor/rails/` first and cite `gem/path.rb:LINE` for each rename; a handful of rows are recorder shape (a chained or nested call the recorder attributes to the wrong callee) and those are reported in the PR body with the Ruby `file:line`, not converged and not baselined.

| File                                  | Method             | Call                | Differing identifiers   |
| ------------------------------------- | ------------------ | ------------------- | ----------------------- |
| `arel/collectors/substitute-binds.ts` | `addBind`          | `quote`             | bind -> extractValue    |
| `arel/factory-methods.ts`             | `createStringJoin` | `create_join`       | to -> node              |
| `arel/table.ts`                       | `as`               | `new`               | constructor -> name     |
| `arel/visitors/dot.ts`                | `visitEdge`        | `visit`             | send -> value           |
| `arel/visitors/to-sql.ts`             | `quoteColumnName`  | `quote_column_name` | name -> toS             |
| `arel/visitors/to-sql.ts`             | `quoteTableName`   | `quote_table_name`  | name -> toS             |
| `did-you-mean/spell-checker.ts`       | `correct`          | `normalize`         | c -> word               |
| `globalid/locator.ts`                 | `locateManySigned` | `locate_many`       | compact -> uris         |
| `globalid/locator.ts`                 | `unscoped`         | `unscoped`          | modelClass -> block     |
| `i18n/backend/base.ts`                | `loadJson`         | `new`               | inspect -> inspectError |
| `i18n/backend/base.ts`                | `loadJson`         | `parse`             | read -> readFile        |
| `i18n/backend/base.ts`                | `loadYml`          | `new`               | inspect -> inspectError |
| `i18n/backend/flatten.ts`             | `resolveLink`      | `store_link`        | gsub -> replaceAll      |

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

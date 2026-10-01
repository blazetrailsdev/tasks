---
title: "Drop the calculation-result casts made redundant by Relation's grouped type"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 170
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR trails#8307 typed `Relation` by whether it is grouped
(`Relation<T, G extends boolean = false>`, `packages/activerecord/src/relation.ts`),
after Rails' `calculate`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:454-458`):
`count` / `sum` / `average` / `minimum` / `maximum` resolve to the scalar when
ungrouped and to the `Map` when grouped.

The casts that worked around the old `number | Map<unknown, number>` union are
now redundant and were left in place to keep that PR small: on `main` at merge,
`git grep -cE "\.(count|sum|average|minimum|maximum)\([^)]*\)\)? as (Map<|number\b|Grouped\b)" -- 'packages/**/*.ts'`
counts 83 casts in 29 files (e.g. `calculations.test.ts`,
`calculations.trails.test.ts`, `relation/grouped-composite-assoc-*.trails.test.ts`,
`relation.ts`'s own `this.count(":all") as Promise<number>`).

A cast that survives hides a regression of the type the PR introduced.

## Acceptance criteria

- [ ] Every cast on a calculation result whose relation's grouping is statically
      known is deleted; `pnpm typecheck` stays green.
- [ ] A cast is kept only where the receiver is `Relation<T, boolean>` — a
      `CollectionProxy` / `AssociationRelation` / `DisableJoinsAssociationRelation`,
      whose association scope may already be grouped.
- [ ] No test name changes.

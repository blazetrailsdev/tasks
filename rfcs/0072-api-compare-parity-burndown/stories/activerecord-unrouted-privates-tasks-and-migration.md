---
title: "Unrouted privates: the database-tasks and migration clusters"
status: draft
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activerecord-unrouted-privates-next-clusters` (PR #6130) shipped exactly one of
the four clusters it named — the preloader/through-association one
(`sourcePreloaders`, `throughPreloaders`, `middleRecords`, `preloadIndex`,
`source/throughRecordsByOwner`, `dataAvailable`, `throughScope`, plus
`preloadScope` / `reflectionScope` / `cascadeStrictLoading` on
`preloader/association.ts`). Two clusters from that list are still untouched;
the third is already owned elsewhere.

**Still to do:**

- `packages/activerecord/src/tasks/database-tasks.ts` — `resolveConfiguration`,
  `databaseAdapterFor`, `classForAdapter`, `eachCurrentConfiguration`,
  `structureDumpFlagsFor`, `structureLoadFlagsFor`, `schemaSha1`,
  `withTemporaryPoolForEach`. Rails:
  `vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb`.
- `packages/activerecord/src/migration.ts` —
  `executeMigrationInTransaction` (migration.ts:2418), `ddlTransaction`
  (migration.ts:2785), `recordVersionStateAfterMigrating` (migration.ts:2456),
  `executeBlock` (migration.ts:1595), `compatibleTableDefinition`
  (migration.ts:1363). Rails:
  `vendor/rails/activerecord/lib/active_record/migration.rb`.

**Already owned — do not re-derive:** the `database-configurations.ts` cluster
(`buildConfigs` / `envWithConfigs` / `walkConfigs`, and the invented
`_buildConfigs` shadow) is the subject of
`converge-databaseconfigurations-build-entry-points-onto-new`
(0023-surfaced-deviations, draft). File nothing new there; converge it under
that story instead.

## The shape that worked

The preloader cluster's fix was mechanical and is the template: the Rails-named
private already existed as a **dead module-level function** at the bottom of the
file, while the live code sat behind an invented `_getXxx` / `_buildXxx` name.
The fix is to rename the live method to the Rails name, point every caller at
it, and delete the dead shim. Check for that pattern first before assuming the
private is genuinely missing.

## Acceptance criteria

- One PR per cluster, each under the LOC ceiling, each from `main`.
- Every ported Rails private carries its Rails name and every internal caller
  routes through it; dead shims standing in for those names are deleted.
- For any argument-dropping case fixed, a test asserting the argument reaches
  the built node/SQL, verified to FAIL on the pre-fix implementation.
- Run `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` before
  `pnpm api:calls:wide`; converged wide-baseline rows are deleted by hand (the
  baseline only shrinks — never `--write`). Expect newly-matched bodies to
  surface pre-existing divergence as new rows; give each a reviewed reason.

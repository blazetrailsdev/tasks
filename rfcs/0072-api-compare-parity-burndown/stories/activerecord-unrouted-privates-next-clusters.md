---
title: "Work the remaining ~90 unrouted-private inventory entries, one cluster per PR"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6130
claim: "2026-08-05T15:21:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: null
closed-reason: null
---

## Context

`activerecord-unrouted-privates-remaining-inventory` (PR #5629) produced a
95-candidate inventory of ported Rails privates that no internal caller routes
through, and shipped exactly one cluster: the create-table definition path
(`createTable` -> `buildCreateTableDefinition` -> `createTableDefinition` +
`setPrimaryKey`). The remaining ~90 entries are untouched.

The full inventory table lives in the story body of
`activerecord-unrouted-privates-remaining-inventory` in this repo — it lists
`refs` count, trails `file:line`, the unrouted private, and the Rails caller(s)
that drop it. Reuse it rather than re-deriving; regenerating it means crossing
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/` against
`scripts/api-compare/output/ts-api.json` again.

Five entries are already resolved and must not be re-derived — they carry a
`reason` on their wide-baseline entry as of PR #5629: `check_int_in_range`
(bare alias), `derive_join_table` (documented import-TDZ deviation),
`sanitize_order_arguments` x2 (own story:
`route-order-args-through-sanitize-order-arguments`), `generate_random_key`
(own story: `encryption-key-generator-returns-base64-not-raw-bytes`).

Natural next clusters, each roughly one PR:

- preloader/through-association (`sourcePreloaders`, `throughPreloaders`,
  `preloadIndex`, `sourceRecordsByOwner`, `throughRecordsByOwner`)
- `tasks/database-tasks.ts` (`resolveConfiguration`, `databaseAdapterFor`,
  `classForAdapter`, `eachCurrentConfiguration`, `structureDumpFlagsFor`,
  `structureLoadFlagsFor`, `schemaSha1`, `withTemporaryPoolForEach`)
- `database-configurations.ts` (`buildConfigs`, `envWithConfigs`,
  `walkConfigs`) — note trails has an invented `_buildConfigs` that shadows
  Rails' `build_configs`; converging means deleting the shadow.
- `migration.ts` (`executeMigrationInTransaction`, `ddlTransaction`,
  `recordVersionStateAfterMigrating`, `executeBlock`,
  `compatibleTableDefinition`)

## Acceptance criteria

- One PR per cluster, each under the 500 LOC ceiling, each from `main`.
- For every argument-dropping case fixed, a test asserting the argument reaches
  the built node/SQL — not merely that the call returns the right class.
- Each new test verified to FAIL on the pre-fix implementation.
- Wide-baseline entries that converge are removed; the baseline only shrinks.
  Re-run `API_COMPARE_FORCE=1 pnpm parity:api --wide-calls` before
  `pnpm parity:api:calls` (a stale artifact reports a false OK).
- Entries confirmed non-actionable get a `reason` on their wide-baseline entry
  so the next sweep does not re-derive them.

---
title: "Route the remaining abstract/schema-statements reflection probes through schemaQuery"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5811
claim: "2026-08-01T18:33:00Z"
assignee: "schema-statements-reflection-probes-still-use-execute"
blocked-by: null
closed-reason: null
---

## Context

PR 5806 converged `SchemaStatements#viewExists` onto `schemaQuery` so its probe
is named `"SCHEMA"`, matching Rails'
`query_values(data_source_sql(view_name, type: "VIEW"), "SCHEMA")`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:74-77`).
PR 5787 did the same for `dataSourceExists`. Both were one-method fixes; the
rest of the file was never audited.

`testing/query-assertions.ts:48` skips payloads whose `name === "SCHEMA"`, so
any reflection read issued through `this.adapter.execute(sql)` is counted by
`assertQueries` and silently inflates every surrounding count.

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
still has read-only reflection probes on `execute`:

- `:712`, `:719`, `:724` — the per-adapter `tables()` / `views()` bodies.
- `:1185`, `:1428` — `PRAGMA table_info(...)`.
- `:1207`, `:1251`, `:1330`, `:1387` — column/index/foreign-key reflection reads.

In Rails these all run through `internal_exec_query(sql, "SCHEMA")` (trails'
`schemaQuery`). The DDL-issuing `execute` calls in the same file (`CREATE TABLE`,
`ALTER TABLE`, `DROP INDEX`, …) are correct as-is and must not be touched — Rails
names those `nil`, not `"SCHEMA"`.

This is latent, not currently red: it only surfaces when an `assertQueries`
block straddles one of these probes. Landing it removes a whole class of
count-inflation traps that has already cost two PRs a CI round each.

## Acceptance criteria

- Every read-only reflection probe in `abstract/schema-statements.ts` issues via
  `this.adapter.schemaQuery(sql)`, not `this.adapter.execute(sql)`.
- DDL-issuing `execute` calls are left alone; the split is reads vs. writes.
- Regression coverage wraps at least one converted probe in
  `assertNoQueries(false, ...)` and fails on the `execute` baseline, in the
  shape of `schema-statements-view-exists.trails.test.ts`.
- Existing schema-statements / migration suites pass on sqlite, pg and mysql.

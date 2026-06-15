---
title: "PG truncate_tables emits per-table TRUNCATE, not Rails' combined statement"
status: claimed
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-15T13:55:33Z"
assignee: "pg-truncate-tables-combined-statement"
blocked-by: null
---

## Context

Surfaced while porting `adapter_test.rb`'s truncate tests in #3178
(f9d-adapter-querycache-truncate-pkreset).

Rails' PG adapter overrides `build_truncate_statements` to emit a single
combined `TRUNCATE TABLE "a", "b", "c"` statement
(`postgresql/database_statements.rb`), which is atomic and avoids per-table
referential-integrity ordering problems. Trails already has the PG override
(`connection-adapters/postgresql/database-statements.ts` `buildTruncateStatements`)
but it is **not wired onto the PG adapter class**, so `truncateTables` falls back
to the abstract per-table form (`connection-adapters/abstract/database-statements.ts`
`truncateTables` → `this.buildTruncateStatements ?? buildTruncateStatements`),
emitting N separate `TRUNCATE TABLE` statements inside `disableReferentialIntegrity`.

Functionally passes today (the abstract path works under `disableReferentialIntegrity`),
but deviates from Rails' call graph and loses single-statement atomicity.

## Acceptance criteria

- [ ] Wire `pgBuildTruncateStatements` onto the PG adapter so `truncateTables`
      emits Rails' combined `TRUNCATE TABLE a, b, c` form.
- [ ] `truncate tables` / `truncate tables with query cache` still pass on PG.
- [ ] `api:compare` / `test:compare` deltas non-negative.

---
title: "Cover the PG/MySQL bulk reverse-FK SQL with an adapter-gated integration test"
status: in-progress
updated: 2026-07-25
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5305
claim: "2026-07-25T14:22:54Z"
assignee: "integration-coverage-bulk-inbound-fk-sql"
blocked-by: null
closed-reason: null
---

## Context

PR #5300 added `bulkInboundFkHost`
(`packages/activerecord/src/test-helpers/canonical-schema.ts`), which replaces
`fkSafeDropPlan`'s per-table inbound scan with one catalog query on PG
(`pg_constraint`, matching `c.confrelid IN (to_regclass(...))`) and MySQL
(`information_schema.key_column_usage`). Unit coverage in
`canonical-schema.test.ts` pins the seam and the row→blocker mapping against a
fake adapter, but the **SQL itself has no CI-asserted end-to-end coverage**: the
integration test that pins the behavior — `"drops a foreign key reaching in from
a table it is not rebuilding"` (`canonical-schema.test.ts:91`) — constructs its
own `BetterSQLite3Adapter(":memory:")`, so it exercises the per-table fallback
only, never the PG/MySQL bulk path.

The bulk path is reached on every PG/MySQL run through the 21
`rebuildCanonicalTables` call sites, so a query that _throws_ would surface. A
query that silently returns no rows would not: the blocker would go unreported
and the DROP would fail, or worse, quietly diverge. During #5300 both the
happy path and the false-positive path (a same-named `decoy.authors` on the
search path / `decoy_db.authors` in another database) were verified by hand
against real PG and MySQL — that verification should be a test.

## Acceptance criteria

- An adapter-gated integration test that, on PG and MySQL, adds a stray FK from
  outside the rebuild set (`addForeignKey("lessons_students", "authors", { column:
"lesson_id" })`), runs `rebuildCanonicalTables(adapter, ["authors"])`, and
  asserts the constraint is gone.
- A companion case pinning the resolution scoping: a same-named table in another
  search-path schema (PG) or another database (MySQL) must NOT be reported as a
  blocker. This is the case that regressed during #5300 review and it is the one
  a name-based rewrite would silently reintroduce.
- Follow the canonical-tables rule — no bespoke tables; the decoy relation is
  deliberately outside the canonical schema and should be created and dropped
  within the test.
- Mind `project_pg_deliberate_error_tests_need_usestransaction` and
  `project_fixtures_transactional_wrapping_breaks_pg_ddl`: this is DDL-heavy and
  must not ride transactional fixtures.

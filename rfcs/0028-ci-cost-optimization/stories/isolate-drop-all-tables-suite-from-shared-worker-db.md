---
title: "Isolate the dropAllTables self-test suite from the shared worker DB"
status: in-progress
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: 5531
claim: "2026-07-28T20:39:08Z"
assignee: "isolate-drop-all-tables-suite-from-shared-worker-db"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/test-helpers/drop-all-tables.test.ts` self-tests the
drop machinery: its `describe("dropAllTables")` block runs the real
`dropAllTables(adapter)` against the **shared per-worker adapter**
(`Base.adapter`) and asserts `tableCount(adapter) === 0`. Those drops are
legitimate and must stay — `audit-afterall-dropalltables-callers` (RFC 0060,
PR #4544) already ruled on that — but they destroy the canonical schema for
every later file in the same worker, because `test-setup-dy.ts` loads the schema
once per _worker_, not once per _file_.

Until PR #5269 this was invisible: `repairWorkerSchema` counted an entirely
missing table as drift (`if (!actual) drifted.push(table)`) and silently
recreated it at the next file's start. Deleting that crutch turned it into a
hard failure — it surfaced as `use-fixtures.test.ts` → `items: relation "items"
does not exist` on the PG lane. #5269 shielded it with
`afterAll(() => rebuildCanonicalTables(adapter, Object.keys(TEST_SCHEMA)))`.

That shield is correct but expensive and blunt: it is a full ~322-table
DROP+CREATE rebuild on every run of the file, and DROP TABLE dominates AR test
wall-time (see RFC 0060's churn measurements). The principled fix is to stop the
suite riding the shared DB at all — give the three `dropAllTables` tests their
own database/connection so wiping it to zero tables harms nobody and no rebuild
is needed.

Measured on sqlite (worker DB inspected directly after the file runs): 0 tables
without the shield, 322 with it.

## Acceptance criteria

- The `describe("dropAllTables")` block runs against an isolated database, not
  the shared per-worker `Base.adapter`; it still asserts a genuine zero-table
  end state (the assertion must not be weakened to a scoped subset).
- The `afterAll` full canonical rebuild added by #5269 is removed once the
  isolation makes it unnecessary.
- Verify the shared worker DB is untouched: after the file runs, its table count
  is non-zero and `items`/`posts` are present (the direct-inspection check #5269
  used).
- The `resetTestTables` block in the same file keeps riding the shared DB — it
  truncates rather than drops and is unaffected.
- All 3 AR lanes green; no `test:compare` regression.

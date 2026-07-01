---
title: "Converge connection-pool.trails.test.ts off invented 'gizmos' raw-CREATE scratch table"
status: in-progress
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: 4384
claim: "2026-07-01T20:00:05Z"
assignee: "converge-connection-pool-trails-gizmos-scratch-table"
blocked-by: null
---

# Converge connection-pool.trails.test.ts off invented `gizmos` scratch table

## Context

`packages/activerecord/src/connection-pool.trails.test.ts:832` raw-creates an
invented DDL table (`CREATE TABLE gizmos (id INTEGER PRIMARY KEY, label TEXT NOT
NULL)`), asserts on it (`:853` `parsed.columns` contains `gizmos`), and tears it
down (`:859` `DROP TABLE IF EXISTS gizmos`). `gizmos` exists in no Rails test —
in vendored Rails `gizmo` only appears as a polymorphic association column name
(`gizmo_type`/`gizmo_id`) in migration/compatibility_test.rb, never as a table.

This is the same invented-scratch-table defect the sibling audit fixed in the
enumerated `.trails` DDL files (PR #4376,
audit-trails-ddl-tests-invented-tables-vs-rails), but connection-pool was NOT in
that story's scope (not touched by #4367). It also seeds a schema-cache fixture
keyed `gadgets` (`:558`, `:578`, `:583`) — verify whether that is a real Rails
name or should converge too.

## Acceptance criteria

- `connection-pool.trails.test.ts` creates no invented table name: the raw
  `gizmos` table becomes a canonical `TEST_SCHEMA` table or a real Rails scratch
  name (e.g. `widgets`/`testings`/`more_testings`), non-overlapping with sibling
  `.trails` files to avoid shared-DB collisions.
- The `gadgets` schema-cache fixture name is verified against Rails and converged
  if invented.
- Test names stay verbatim; `test:compare` does not regress.

## Notes

Follow-up to #4376. Companion to
`fidelity-audit-canonical-scratch-and-bespoke-tables` and
`converge-mysql2-trails-ex-subscribers-to-canonical`.

---
title: "drops 3-table FK chain test declares no foreign keys"
status: ready
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/drop-all-tables.test.ts`'s
`"drops 3-table FK chain without error"` names the thing it is protecting — that
`dropAllTables` orders its `DROP TABLE`s so a referencing table goes before the
table it references — but the DDL it lays down declares no foreign keys at all:

```sql
CREATE TABLE fk_parent (id INTEGER PRIMARY KEY)
CREATE TABLE fk_child (id INTEGER PRIMARY KEY, parent_id INTEGER)
CREATE TABLE fk_grandchild (id INTEGER PRIMARY KEY, child_id INTEGER)
```

`parent_id` / `child_id` are plain integer columns. Dropping the three in any
order succeeds on every lane, so the test passes identically with the ordering
logic removed — it is a no-op guard in the shape of a regression test. It
predates PR #5599 (which only moved it onto the arunit2 pool) and was not
introduced by it.

## Acceptance criteria

- The chain carries real constraints (`REFERENCES fk_parent(id)` /
  `REFERENCES fk_child(id)`, or the equivalent through
  `schemaStatements().addForeignKey`), so the test fails if `dropAllTables`
  drops the parent before its children.
- Confirm the regression bite on a baseline: with the drop ordering neutralized
  the test must fail, and it must fail on PG and MySQL as well as sqlite (sqlite
  does not enforce FKs unless `PRAGMA foreign_keys` is on, so a sqlite-only
  check can still be vacuous).
- The tables ride the arunit2 pool and are cleaned up by the existing
  `afterEach(provisionSecondDatabase)`; do not reintroduce a per-file database.
- Do not rename the test.

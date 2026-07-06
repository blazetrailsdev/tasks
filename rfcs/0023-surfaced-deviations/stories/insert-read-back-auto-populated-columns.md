---
title: "insert-read-back-auto-populated-columns"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-06T03:46:25Z"
assignee: "insert-read-back-auto-populated-columns"
blocked-by: null
closed-reason: null
---

## Context

`persistence_test.rb`'s `test_fills_auto_populated_columns_on_creation`
(persistence_test.rb:67/95/108) asserts that DB-computed defaults are visible on
the record returned by `Default.create` — e.g. `record.ruby_on_rails ==
"Ruby on Rails"`, `record.random_number`, `record.modified_time`, etc.

trails cannot satisfy this today: its insert path
(`packages/activerecord/src/base.ts` `_createRecord`, ~line 3455) deliberately
gates the RETURNING list to a SINGLE column — the auto-increment PK — because the
scalar adapters surface only one value on INSERT (SQLite `lastInsertRowid`,
MySQL `insertId`, PG's first RETURNING column). Rails instead reads back the full
RETURNING row and zips EVERY auto-populated column
(`_returning_columns_for_insert` → `_create_record` `returning_columns.zip(
returning_values)`). So after `create`, non-PK DB-populated columns come back nil
in trails; only a subsequent `reload` fetches them.

The test is ported verbatim in `packages/activerecord/src/persistence.test.ts`
(the adapter-specific `defaults` table build is present and faithful) but
`it.skip`-ped, tracked here.

## Acceptance criteria

- [ ] `_insertRecord` / `_createRecord` reads back all auto-populated columns via
      a multi-column RETURNING (PG/SQLite/MariaDB) and zips them onto the record,
      mirroring Rails `_create_record`.
- [ ] Un-skip `fills auto populated columns on creation` in persistence.test.ts;
      it passes on all three adapters with the Rails-verbatim adapter gating.

---
title: "Add pk_autopopulated_by_a_trigger_records to canonical adapter-specific schema and port persistence test"
status: done
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4618
claim: "2026-07-06T17:16:58Z"
assignee: "persistence-pk-trigger-record-canonical-schema"
blocked-by: null
---

## Context

`test_model_with_no_auto_populated_fields_still_returns_primary_key_after_insert` (persistence_test.rb:1609) uses `PkAutopopulatedByATriggerRecord` — a model whose PK is populated by a DB trigger, not by `RETURNING` or `last_insert_id`. The model file exists at `packages/activerecord/src/test-helpers/models/pk-autopopulated-by-a-trigger-record.ts` but the table is not in the canonical schema.

Rails defines `pk_autopopulated_by_a_trigger_records` in adapter-specific schemas with a `BEFORE INSERT` trigger that computes the PK (`MAX(id) + 1`):

- `mysql2_specific_schema.rb:85` — MySQL2/Trilogy
- `postgresql_specific_schema.rb:204` — PostgreSQL (with `CREATE FUNCTION`)

The test is gated `supports_insert_returning? && !current_adapter?(:SQLite3Adapter)` (PG + MySQL with `insert_returning`). Trails equivalent: `adapterType !== "sqlite" && adapterSupports("insert_returning")`.

To port this test:

1. Add `pk_autopopulated_by_a_trigger_records` to `POSTGRESQL_SPECIFIC_SCHEMA` and a MySQL-specific schema (or handle in test setup), with the trigger DDL.
2. Add `PkAutopopulatedByATriggerRecord` to `fixtures-registry.ts`.
3. Port the test in `persistence.test.ts` under the `POSTGRESQL_SPECIFIC_SCHEMA` block or a new adapter-gated block.

## Acceptance criteria

- [ ] `pk_autopopulated_by_a_trigger_records` table + trigger present in adapter-specific canonical schema for PG and MySQL.
- [ ] `PkAutopopulatedByATriggerRecord` in fixture registry.
- [ ] `model with no auto populated fields still returns primary key after insert` ported verbatim, gated on `adapterType !== "sqlite" && adapterSupports("insert_returning")`.
- [ ] Tests pass on PG; SQLite skips.

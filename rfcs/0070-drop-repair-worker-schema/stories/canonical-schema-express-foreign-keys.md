---
title: "Let the canonical schema declare schema.rb foreign keys (drops adapter.test raw-DDL workaround)"
status: ready
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `activerecord/test/schema/schema.rb` declares a real
`foreign_key` on `fk_test_has_fk` (`fk_id` -> `fk_test_has_pk.pk_id`), but
neither `test-helpers/canonical-schema.ts` (`fk_test_has_pk` /
`fk_test_has_fk` at canonical-schema.ts:1683,1687) nor `TEST_SCHEMA`
(`test-schema.ts:1658`) can express FK constraints.

`AdapterForeignKeyTest` in `packages/activerecord/src/adapter.test.ts:538`
works around this: on sqlite it DROPs both canonical tables and recreates
them with an inline `FOREIGN KEY` clause via raw DDL, then (as of #5258)
rebuilds the canonical shape in `afterAll`; on pg/mysql it adds and drops
the constraint with raw `ALTER TABLE` DDL. That drop/recreate cycle was the
RFC 0070 drift source this story chain is eliminating, and the raw-DDL
workaround is the only reason the cycle exists.

## Acceptance criteria

- Canonical schema can declare a `foreignKey` on a table (mirroring
  schema.rb's `t.foreign_key` / `create_table ... foreign_key`), emitted by
  the canonical loader for all three adapters.
- `fk_test_has_fk` declares its schema.rb foreign key canonically.
- `AdapterForeignKeyTest` drops its raw-DDL add/drop-constraint workaround
  and its sqlite drop/recreate + `rebuildCanonicalTables` teardown.
- No test renamed; `test:compare` delta >= 0.

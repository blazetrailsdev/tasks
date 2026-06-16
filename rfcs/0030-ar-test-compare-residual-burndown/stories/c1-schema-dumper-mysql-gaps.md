---
title: "c1-schema-dumper-mysql-gaps"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-16T00:44:53Z"
assignee: "c1-schema-dumper-mysql-gaps"
blocked-by: null
---

## Context

Spun off from `c1-schema-dumper-residual-gaps` (RFC 0030). That story shipped the
cross-adapter schema_dumper gaps (aliased types, infinity defaults). The MySQL-only
gaps remain. These tests in `packages/activerecord/src/schema-dumper.test.ts` are
still `it.skip` and need MySQL adapter work beyond the dumper:

1. **`schema dump includes length for mysql blob and text fields`** — the `size:`
   option on `t.binary`/`t.text` is dropped on the _creation_ path, so
   `t.binary "x", size: :tiny` creates a plain BLOB and the dump omits the size.
   `t.tinyblob`/`t.tinytext` round-trip fine; the `size:`-option form does not.
   Fix in mysql schema-statements size: → DDL type mapping.

2. **`schema dumps index type`** (mysql `type: :fulltext`) and the mysql branch of
   **`schema dumps index length`** (`length: 10`) — index `type:` and sub-part
   `length:` are neither honored on the addIndex creation path nor surfaced by
   mysql `indexes()` introspection, so `SchemaDumper#indexParts` never emits them.
   Fix in mysql adapter index introspection + addIndex.

Rails source: `vendor/rails/activerecord/test/cases/schema_dumper_test.rb`
(`test_schema_dump_includes_length_for_mysql_blob_and_text_fields` :330,
`test_schema_dumps_index_type` :353, `test_schema_dumps_index_length` :212).

## Acceptance criteria

- [ ] `schema dump includes length for mysql blob and text fields` un-skipped, passes on mysql.
- [ ] `schema dumps index type` un-skipped, passes on mysql.
- [ ] The mysql branch of `schema dumps index length` restored (currently
      `skipIf(adapterType === "mysql")`) and passes on mysql.
- [ ] Test names match Rails verbatim. No new gate-mismatches.

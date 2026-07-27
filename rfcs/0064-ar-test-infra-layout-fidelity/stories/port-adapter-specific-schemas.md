---
title: "port-adapter-specific-schemas"
status: draft
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`support/load-schema-helper.ts` (PR #5400) implements
`LoadSchemaHelper#load_schema`'s adapter-specific arm
(`vendor/rails/activerecord/test/support/load_schema_helper.rb:10,15`) as the
`ADAPTER_SPECIFIC_SCHEMAS` lookup, but only the postgres entry is populated, and
only with the slice of `postgresql_specific_schema.rb:4-16` trails already had:
the `uuid-ossp` / `pgcrypto` header and the `chat_messages` /
`chat_messages_custom_pk` uuid-PK tables (lifted from the inline setup in
`packages/activerecord/src/persistence.test.ts:1703-1730`).

Unported, so every lane currently boots without them:

- `vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:18-226` —
  `uuid_parents`, `uuid_children`, `defaults` (expression + virtual-stored
  defaults, `timestamptz`), `postgresql_times`, `postgresql_oids`, and the
  remaining PG-only tables.
- `vendor/rails/activerecord/test/schema/mysql2_specific_schema.rb:3-95` —
  `datetime_defaults`, `timestamp_defaults`, `binary_fields`, the stored
  procedures, and the trigger-backed primary-key tables.
- `vendor/rails/activerecord/test/schema/sqlite_specific_schema.rb:3-21` —
  the SQLite `defaults` table.

Note `defaults` is defined by all three files with adapter-specific default
expressions, so it belongs in the adapter-specific arm, not in
`support/canonical-schema.ts`.

## Acceptance criteria

- Populate the `mysql` and `sqlite` entries of `ADAPTER_SPECIFIC_SCHEMAS` and
  extend the postgres entry, mirroring each `*_specific_schema.rb` table by
  table (names, columns, defaults verbatim).
- Repoint `persistence.test.ts`'s inline `chat_messages` /
  `chat_messages_custom_pk` setup (and any sibling that lays an
  adapter-specific table inline) at the boot-laid schema.
- Gate on the same predicates Rails uses (`supports_pgcrypto_uuid?`,
  `supports_virtual_columns?`, `supports_default_expression?` in
  `support/supports.ts`) rather than bare adapter-name checks where Rails does.
- Split across PRs if needed to stay under the 500 LOC ceiling — one adapter per
  PR is the natural cut.

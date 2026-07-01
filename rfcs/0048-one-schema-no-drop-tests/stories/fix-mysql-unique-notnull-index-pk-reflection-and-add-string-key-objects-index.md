---
title: "fix-mysql-unique-notnull-index-pk-reflection-and-add-string-key-objects-index"
status: done
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: 4379
claim: "2026-07-01T17:38:12Z"
assignee: "fix-mysql-unique-notnull-index-pk-reflection-and-add-string-key-objects-index"
blocked-by: null
---

## Context

Follow-up to `converge-schema-dumper-test-canonical-schema` (PR #4366). A Codex
review noted that canonical `TEST_SCHEMA.string_key_objects` omits the
`t.index :id, unique: true` that Rails' schema.rb declares
(`vendor/rails/activerecord/test/schema/schema.rb:1162-1166`), so
`SchemaDumperTest`'s "keeps id false when id is false and unique not null column
added" does not fully exercise the shape Rails covers.

Adding that index to the canonical table (via `IndexSpec { columns: "id",
unique: true }`) surfaces a trails MySQL/MariaDB deviation: the schema reflection
promotes a UNIQUE NOT NULL index to the PRIMARY KEY, so the dump emits
`createTable("string_key_objects", { id: "string", ... })` instead of
`{ id: false }`. Rails/MySQL keep such an index a plain unique key (`SHOW CREATE
TABLE` shows `UNIQUE KEY id (id)`, not PRIMARY), so Rails dumps `id: false` on
MySQL. The index addition was therefore reverted from PR #4366 to keep the
MariaDB CI lane green; the canonical table remains faithful except for this one
index.

Observed CI failure (MariaDB, PR #4366): dump produced
`createTable("string_key_objects", { id: "string", charset: ..., force: "cascade" })`

- `addIndex("string_key_objects", "id", { ..., unique: true })`, failing the
  `/createTable\("string_key_objects",\s*\{[^}]*id:\s*false/` assertion.

## Acceptance criteria

- [ ] Fix trails' MySQL/MariaDB primary-key reflection so a UNIQUE NOT NULL
      index is NOT reported as the primary key (match Rails/MySQL: it stays a
      unique key; the table has no PK), so the dumper emits `id: false`.
- [ ] Add `indexes: [{ columns: "id", unique: true }]` to canonical
      `TEST_SCHEMA.string_key_objects`, mirroring schema.rb exactly.
- [ ] `SchemaDumperTest` "keeps id false when id is false and unique not null
      column added" passes on sqlite, postgres, and mysql/mariadb while riding
      canonical `string_key_objects`.
- [ ] Check blast radius: `locking.test.ts` and any other sibling riding
      `string_key_objects` still pass; test:compare non-negative.

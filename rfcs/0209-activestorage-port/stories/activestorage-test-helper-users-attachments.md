---
title: "activestorage-test-helper-users-attachments"
status: ready
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps:
  - activestorage-attached-many
  - activestorage-attached-model-and-one
  - activestorage-filename-record-and-current
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

`activestorage-migrations-and-test-database` ported `test/database/setup.rb` and the
`User` / `Group` models of `vendor/rails/v8.0.2/activestorage/test/test_helper.rb:129-201`
into `packages/activestorage/src/test-helpers/test-helper.ts`, but without the parts that
need unported code:

- every `has_one_attached` / `has_many_attached` declaration on `User` (`:136-167`) and
  `Group` (`:197`), with their `variant` blocks;
- `after_update_commit :notify` and `notify` (`:170`, `:184-186`), which read
  `highlights_attachments`;
- `accepts_nested_attributes_for :highlights_attachments, allow_destroy: true` (`:172`).

`packages/activestorage/src/migrations.test.ts`'s `activeStorageTables` lists the three
table names where Rails' `active_storage_tables` maps `ActiveStorage::Record.descendants`
(`vendor/rails/v8.0.2/activestorage/test/migrations_test.rb:55-57`), because `Record`,
`Blob`, `Attachment` and `VariantRecord` are not ported yet.

## Acceptance criteria

- `User` and `Group` declare every attachment, callback and nested-attributes line of
  `test_helper.rb:129-201` as written.
- `activeStorageTables` is `ActiveStorage.Record.descendants()` mapped to `tableName`.

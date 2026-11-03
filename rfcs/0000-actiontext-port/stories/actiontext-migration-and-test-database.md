---
title: "Port the action_text_rich_texts migration, dummy schema, models and fixtures"
status: draft
updated: 2026-11-03
rfc: "0000-actiontext-port"
cluster: at-models
packages: ["actiontext"]
deps: ["actiontext-parity-enrollment-and-package", "activestorage-migrations-and-test-database"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/db/migrate/20180528164100_create_action_text_tables.rb` (25): the
  `action_text_rich_texts` table, with the `primary_and_foreign_key_types`
  helper.
- `test/dummy/db/schema.rb` (78): messages, people, reviews, pages, plus
  ActiveStorage's three tables and `action_text_rich_texts`.
- `test/dummy/app/models/*.rb`: `Message`, `MessageWithoutBlanks`,
  `MessageWithoutBlanksWithContentValidation`, `EncryptedMessage`, `Page`,
  `Person`, `Review`, `ApplicationRecord`.
- `test/fixtures/{messages,people,reviews}.yml` and
  `test/fixtures/action_text/rich_texts.yml`, `test/fixtures/files/**`.
- `test/test_helper.rb` (46).

`activestorage-migrations-and-test-database` (RFC 0209) is the precedent for
an engine's own test database and dummy schema.

## Acceptance criteria

- The migration is ported at its Rails file name and is what the dummy
  schema loads.
- The dummy schema, models and fixtures are mirrored as written (names,
  columns, rows), not added to activerecord's `schema.rb` mirror.
- The test helper is the counterpart of `test_helper.rb`, on all three
  adapters.

---
title: "actiontext-dummy-models-rich-text-and-fixtures"
status: ready
updated: 2026-11-09
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps:
  - actiontext-record-rich-text-and-attribute
  - actiontext-attachables
  - actiontext-model-tests-and-fixture-set
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

`actiontext-migration-and-test-database` ported the dummy schema, models and
fixtures under `packages/actiontext/test/`, minus the lines that need unported
ActionText code:

- `vendor/rails/v8.0.2/actiontext/test/dummy/app/models/message.rb:2-3`,
  `review.rb:4`, `message_without_blanks.rb:4`, `encrypted_message.rb:2`:
  `has_rich_text` (needs `ActionText::Attribute`, story
  `actiontext-record-rich-text-and-attribute`).
- `page.rb:2`, `person.rb:2`: `include ActionText::Attachable`
  (story `actiontext-attachables`).
- `test/fixtures/action_text/rich_texts.yml`: its ERB bodies call
  `ActionText::FixtureSet.attachment` (story
  `actiontext-model-tests-and-fixture-set`).
- `test/test_helper.rb:28-36`: `QueryHelpers` and `create_file_blob`.

## Acceptance criteria

- The dummy models carry their `has_rich_text` / `Attachable` lines as written.
- `test/fixtures/action_text/rich_texts.ts` mirrors `rich_texts.yml`'s rows.
- `test/test-helper.ts` gains `createFileBlob` and `QueryHelpers`.

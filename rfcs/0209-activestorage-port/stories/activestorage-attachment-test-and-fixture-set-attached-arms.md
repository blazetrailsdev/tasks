---
title: "activestorage-attachment-test-and-fixture-set-attached-arms"
status: ready
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps:
  - activestorage-attached-many
  - activestorage-attached-model-and-one
  - activestorage-reflection-and-validations
  - activestorage-image-analyzers
  - activestorage-variation-and-variants
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

`Attachment` and `FixtureSet` landed before `has_one_attached`, so these tests have nothing to run against yet:
`vendor/rails/v8.0.2/activestorage/test/models/attachment_test.rb` (all but "can create an attachment with the
record having no attachment reflections") and `test/fixture_set_test.rb`'s `test_active_storage_attachment` and
`test_active_storage_metadata` (`:20-37`). `packages/activestorage/src/fixture-set.test.ts`'s
`test_active_storage_blob` reads `Attachment.findBy` where Rails reads `user.avatar`.
`attachment.test.ts` and `attachment.trails.test.ts` assign `isAnalyzed`, `analyzeLater` and
`isPreviewImageNeededBeforeProcessingVariants` onto `Blob.prototype`, and `attachmentReflections` onto
`User.prototype`, standing in for Blob::Analyzable, Blob::Representable and ActiveStorage::Reflection.
`test-helper.ts`'s `extractMetadataFrom` casts for `analyze`.

## Acceptance criteria

- `attachment_test.rb` is ported in full, variant / preview arms included, and those shims are deleted.
- The two skipped fixture-set tests run, and `test_active_storage_blob` reads `user.avatar`.
- `test_active_storage_blob` compares files with `FileUtils.identical?` as Rails does.

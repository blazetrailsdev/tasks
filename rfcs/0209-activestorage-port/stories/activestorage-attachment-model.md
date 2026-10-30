---
title: "Port ActiveStorage::Attachment"
status: in-progress
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: as-models
packages: ["activestorage"]
deps: ["activestorage-blob-and-downloader"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9485
claim: "2026-10-30T11:26:41Z"
assignee: "activestorage-attachment-model"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/attachment.rb` (176): `belongs_to :record`
(polymorphic, `touch:`) and `:blob` (`:25-31`), `delegate_missing_to :blob`
(`:33`), `after_create_commit` analyze / mirror / transform-variants
(`:126-148`), `purge` / `purge_later` (`:51-66`), `variant` / `preview` /
`representation` (`:82-124`), `dependent` (`:154`). Test:
`test/models/attachment_test.rb` (19).

## Acceptance criteria

- `Attachment` is ported; `delegate_missing_to :blob` is a Proxy over
  `delegateMissingTo`, with its row added to CLAUDE.md's `method_missing`
  table.
- The after-commit callbacks enqueue through async `perform_later`.
- The variant / preview arms of `attachment_test.rb` wait on the variants
  story; the rest pass.

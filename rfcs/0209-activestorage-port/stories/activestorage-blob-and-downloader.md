---
title: "Port ActiveStorage::Blob with Identifiable, Servable and the Downloader"
status: draft
updated: 2026-10-28
rfc: "0209-activestorage-port"
cluster: as-models
packages: ["activestorage"]
deps:
  [
    "activestorage-disk-service",
    "activestorage-migrations-and-test-database",
    "activestorage-filename-record-and-current",
  ]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/blob.rb` (380): callbacks (`:40-50`),
`find_signed` / `find_signed!` (`:69-78`), `build_after_unfurling` /
`create_after_unfurling!` / `create_and_upload!` / `create_before_direct_upload!`
(`:80-113`), `generate_unique_secure_token`, `compose` (`:144-160`), `signed_id`,
`key` (`:170-176`, `has_secure_token`), `upload` / `unfurl` /
`upload_without_unfurling` (`:243-257`), `download` / `download_chunk` / `open`
(`:266-297`), `delete` / `purge` / `purge_later` (`:306-325`), `service`,
`compute_checksum_in_chunks`, `extract_content_type` (Marcel),
`touch_attachments`, `update_service_metadata`. `blob/identifiable.rb` (33),
`blob/servable.rb` (22), `lib/active_storage/downloader.rb` (43) and
`app/jobs/active_storage/purge_job.rb` (13). `analyzable` and `representable`
are later stories.

## Acceptance criteria

- `Blob` is ported with the RFC's async boundary: every service, database and
  job call is awaited, and `create_and_upload!` follows the create-path
  ruling.
- `Downloader#open` verifies the MD5 checksum and raises `IntegrityError` as
  Rails does; `open` yields a ruby-compat `Tempfile`.
- `PurgeJob` is ported (async `perform`).
- Blob tests are the `activestorage-blob-test` story; this story adds the
  `blob_test.rb` cases needed to exercise each arm it ports.

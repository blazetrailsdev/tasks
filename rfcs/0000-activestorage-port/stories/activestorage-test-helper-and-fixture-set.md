---
title: "Port ActiveStorage::FixtureSet and the suite's test_helper"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-models
packages: ["activestorage"]
deps: ["activestorage-blob-and-downloader"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/test_helper.rb` (201) gives every test `create_blob`,
`create_file_blob`, `create_blob_before_direct_upload`,
`build_blob_after_unfurling`, `directly_upload_file_blob`, `read_image`,
`extract_metadata_from`, `fixture_file_upload`, `with_service`,
`with_strict_loading_by_default`, `without_variant_tracking`,
`with_raise_on_open_redirects`, `subscribe_events_from` (`:42-127`).
`lib/active_storage/fixture_set.rb` (79) is public API (`blob(filename:)`,
`prepare`), tested by `test/fixture_set_test.rb` (3) over
`test/fixtures/active_storage/*.yml` and `test/fixtures/files/*`.

## Acceptance criteria

- `FixtureSet` is ported in lib; the helpers are ported into the package's
  test-helpers module at their Rails names, async where they upload.
- `test/fixtures/files` are byte-for-byte copies, binary in
  `.gitattributes`, exempt from the control-byte and format checks as
  mini_magick's fixtures are.
- `fixture_set_test.rb` passes.

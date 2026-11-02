---
title: "Port Variation, Variant, VariantRecord, VariantWithRecord, Blob::Representable and TransformJob"
status: in-progress
updated: 2026-11-02
rfc: "0209-activestorage-port"
cluster: as-variants
packages: ["activestorage"]
deps: ["activestorage-transformers", "activestorage-attachment-model"]
deps-rfc: []
est-loc: 650
priority: null
pr: trails#9606
claim: "2026-11-02T01:46:39Z"
assignee: "activestorage-variation-and-variants"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/variation.rb` (87: `wrap`, `decode`,
`encode`, `default_to`, `transform`, `format`, `content_type`, `key`,
`digest`), `variant.rb` (118: `processed`, `key`, `url`, `download`, `image`,
`process`), `variant_record.rb` (8), `variant_with_record.rb` (72:
`processed`, `transform_blob`, `create_or_find_record`),
`blob/representable.rb` (137: `variant`, `variable?`, `preview`,
`previewable?`, `representation`, `preprocessed`, the `variant_records` and
`preview_image` associations) and `app/jobs/active_storage/transform_job.rb`
(12).

## Acceptance criteria

- The classes are ported with `processed`, `process`, `transform` and
  `download` async, and `key` / `digest` / `format` sync (RFC "Variants and
  previews").
- `Variation.encode` / `decode` use `ActiveStorage.verifier` as Rails does.
- `track_variants` true and false both reach the right class.
- The variant tests are the `activestorage-variant-tests` story.

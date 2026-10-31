---
title: "Port Transformers::Transformer and ImageProcessingTransformer"
status: in-progress
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: as-variants
packages: ["activestorage"]
deps:
  [
    "activestorage-blob-and-downloader",
    "image-processing-mini-magick-backend",
    "image-processing-vips-backend-over-wasm-vips",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9548
claim: "2026-10-31T19:01:14Z"
assignee: "activestorage-transformers"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/transformers/transformer.rb` (41: `initialize`,
`transform(file, format:)` yielding a Tempfile, abstract `process`) and
`image_processing_transformer.rb` (110): `process` (`:19-26`) builds
`processor.source(file)` and applies `operations` (`:32-49`), with the
`validate_transformation` / `validate_arg_*` checks against
`supported_image_processing_methods` (`:51-108`); `processor` (`:28-30`) picks
`ImageProcessing::Vips` or `::MiniMagick` from `ActiveStorage.variant_processor`.
This is the consumer of RFC 0202, not a re-port of it.

## Acceptance criteria

- The transformers are ported over `@blazetrails/image-processing`; the
  pipeline is run by awaiting it (RFC 0202's thenable Chainable) or by
  `call(file, …)`, as Rails calls `call`.
- An unsupported method or argument raises `UnsupportedImageProcessingMethod`
  / `UnsupportedImageProcessingArgument` as Rails does.
- `variant_processor` `:mini_magick` and `:vips` both work (open question 4).

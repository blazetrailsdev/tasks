---
title: "Port the ActiveStorage module config, errors, deprecator and LogSubscriber"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-infra
packages: ["activestorage"]
deps: ["activestorage-parity-enrollment-and-package"]
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

`vendor/rails/v8.0.2/activestorage/lib/active_storage.rb` (374 lines) declares the module's `mattr_accessor`s
(`:48-366`: `logger`, `verifier`, `variant_processor` default `:mini_magick`,
`queues`, `previewers`, `analyzers`, `paths`, the content-type lists,
`supported_image_processing_methods` and `unsupported_image_processing_arguments`,
`service_urls_expire_in`, `routes_prefix`, `track_variants`,
`video_preview_arguments`, …) and its `autoload`s (`:42-46`, `:371-372`).
`errors.rb` (29) defines `Error`, `InvariableError`, `UnpreviewableError`,
`UnrepresentableError`, `IntegrityError`, `FileNotFoundError`, `PreviewError`
and `PreviewImageNotFoundError`. `deprecator.rb` (7) and `log_subscriber.rb`
(76) round it out.

## Acceptance criteria

- `active-storage.ts` holds the module seat with every accessor at its Rails
  default and name, the `autoload`s as namespace seats (CLAUDE.md
  "Call-time constant resolution").
- Every error class in `errors.rb` exists with Rails' superclass.
- `LogSubscriber` subscribes to the `*.active_storage` events at Rails'
  levels and messages.
- `pnpm parity:api` credits these files with no extra surface.

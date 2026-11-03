---
title: "activestorage-engine-configs-initializer-assigns-every-option"
status: draft
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
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

`packages/activestorage/src/engine.ts`'s `active_storage.configs` initializer (added in trails#9664) ports only the `previewers` / `analyzers` assignments of Rails' `config.after_initialize` block (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:88-115`). The rest are missing: logger, variant_processor, paths, routes_prefix, draw_routes, resolve_model_to_route, queues, variable_content_types, web_image_content_types, content_types_to_serve_as_binary, content_types_allowed_inline, binary_content_type, service_urls_expire_in, touch_attachment_records, urls_expire_in, track_variants, video_preview_arguments, silence_invalid_content_types_warning and supported_image_processing_methods. The engine also lacks the matching `config.active_storage.*` defaults (`engine.rb:31-85`).

## Acceptance criteria

- Every assignment in `engine.rb:88-115` is ported in order in the `active_storage.configs` initializer, with the defaults from `engine.rb:31-85`.
- The test setup (`packages/activestorage/src/test-helpers/database/setup.ts`) no longer seeds anything the initializer assigns.

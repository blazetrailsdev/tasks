---
title: "Preview delegates filename/content_type without a prior processed()"
status: draft
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Preview` delegates `filename` and `content_type` to `presentation` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/preview.rb:36`). `presentation` is `variant? ? variant.processed : image` (`:127-129`), so a read on any preview processes the variant in line. In trails, `variant.processed` is async, so `Preview#processed` (`packages/activestorage/src/preview.ts`) stores the awaited presentation in a private `_presentation` field. The sync `filename` / `contentType` getters read that field, and raise `UnprocessedError` before `processed()` has run (trails#9664). Rails never raises there.

## Acceptance criteria

- `Preview#filename` / `#contentType` answer as Rails' delegation does without a prior `processed()` call. Either the presentation is loaded synchronously once the image is attached (the sync-after-load shape `Attached::One` uses), or the decision is ratified in CLAUDE.md and the field carries a receipt citing it.
- The `_presentation` field is removed, or it is receipted against that ratified section.

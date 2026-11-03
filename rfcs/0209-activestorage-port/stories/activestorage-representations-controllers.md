---
title: "Port the representation base, redirect and proxy controllers"
status: done
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: as-controllers
packages: ["activestorage"]
deps: ["activestorage-blobs-controllers-and-streaming", "activestorage-previewers-and-preview"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9676
claim: "2026-11-03T17:32:08Z"
assignee: "activestorage-representations-controllers"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/controllers/active_storage/representations/base_controller.rb` (18,
`set_representation` via `blob_scope.representation(…).processed`),
`redirect_controller.rb` (14) and `proxy_controller.rb` (18). Tests:
`test/controllers/representations/redirect_controller_test.rb` (11),
`proxy_controller_test.rb` (12), over variants and previews.

## Acceptance criteria

- The three controllers are ported; `set_representation` awaits
  `processed`, and an unrepresentable blob answers Rails' 404.
- Both test files pass.

## Notes

Write `await` on every `blob.url`, `serviceUrlForDirectUpload` and `variant.url`
call even while they are sync. The `activestorage-cloud-services` RFC makes them
async, and this way either landing order is correct.

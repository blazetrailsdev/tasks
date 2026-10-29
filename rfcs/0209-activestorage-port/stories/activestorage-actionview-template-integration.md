---
title: "Port the image_tag, video_tag and audio_tag integration with attachments"
status: ready
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: as-engine
packages: ["activestorage"]
deps: ["activestorage-engine", "activestorage-previewers-and-preview"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The engine's `action_view.configuration` initializer
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:171-181`) lets `image_tag` / `video_tag` /
`audio_tag` take a blob, attachment or variant through `polymorphic_url` and
the `resolve` routes. Tests: `test/template/image_tag_test.rb` (6),
`video_tag_test.rb` (4), `audio_tag_test.rb` (4).

## Acceptance criteria

- The three tag helpers accept ActiveStorage objects through actionview's
  `asset-tag-helper.ts` as Rails' do, with no activestorage import in
  actionview.
- The three test files pass.

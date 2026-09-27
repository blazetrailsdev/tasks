---
title: "Port AssetTagHelper#video_tag, #audio_tag and multiple_sources_tag_builder"
status: draft
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: ["asset-url-helper-video-audio-font-path-and-url"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-rest-of-asset-tag-helper-and-asset-url-helper`.
Unported in `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb`:
`video_tag` (`:561`), `audio_tag` (`:593`) and the private
`multiple_sources_tag_builder` (`:598`). Depends on
`asset-url-helper-video-audio-font-path-and-url` for `path_to_video` /
`path_to_audio`.

Tests: `VideoLinkToTag` (`asset_tag_helper_test.rb:363-387`), `AudioLinkToTag`
(`:417-425`) and the `test_video_tag*` / `test_audio_tag*` methods.

## Acceptance criteria

- The three methods ported in Rails source order into `helpers/asset-tag-helper.ts`.
- Their Rails tests are enrolled under verbatim names.

---
title: "Port activestorage's v8.0.5.2 playlist analyzer tests"
status: claimed
updated: 2026-11-26
rfc: "0256-rails-8-0-5-2-burn-down"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-26T00:00:07Z"
assignee: "activestorage-playlist-analyzer-tests"
blocked-by: null
closed-reason: null
---

## Context

Rails v8.0.5.2 added two playlist tests to
`vendor/rails/v8.0.5.2/activestorage/test/analyzer/audio_analyzer_test.rb:21`
("analyzing a playlist declared as audio", and its video sibling in
`video_analyzer_test.rb`). Both use `create_playlist_blob(referencing:, filename:, content_type:)`
and rely on ffprobe's `-format_whitelist` (`ActiveStorage.ffmpegFormatWhitelistArguments()`,
landed in trails#10689) to reject the hls demuxer. trails#10689 did not port them: no
`createPlaylistBlob` helper exists in `packages/activestorage/test/support/test-helper.ts`.

## Acceptance criteria

- Port `create_playlist_blob` from `activestorage/test/test_helper.rb` as `createPlaylistBlob`.
- Port both playlist tests under their Rails names; analyzer returns no duration/metadata.

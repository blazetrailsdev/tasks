---
title: "Port AudioAnalyzer and VideoAnalyzer, shelling out to ffprobe"
status: in-progress
updated: 2026-11-02
rfc: "0209-activestorage-port"
cluster: as-analysis
packages: ["activestorage"]
deps: ["activestorage-image-analyzers", "ruby-compat-io-popen", "activestorage-ci-media-binaries"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9604
claim: "2026-11-02T01:06:38Z"
assignee: "activestorage-audio-video-analyzers"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/analyzer/audio_analyzer.rb` (77) and
`video_analyzer.rb` (157) run `ffprobe -print_format json -show_streams
-show_format` through `IO.popen` (`audio_analyzer.rb:56-71`), parse the JSON,
and log "Skipping … because ffprobe isn't installed" on `Errno::ENOENT`. Video
computes `width` / `height` / `angle` / `display_aspect_ratio` / `audio?` /
`video?`. Tests: `test/analyzer/audio_analyzer_test.rb` (2),
`video_analyzer_test.rb` (9).

## Acceptance criteria

- Both analyzers shell out through ruby-compat `IO.popen` with
  `ActiveStorage.paths[:ffprobe]`, as Rails does.
- The missing-binary arm logs and answers `{}` as Rails does.
- The two test files pass against CI's ffprobe.

---
title: "Install ffmpeg, mupdf-tools and poppler-utils on the activestorage CI lanes"
status: draft
updated: 2026-10-28
rfc: "0209-activestorage-port"
cluster: as-infra
packages: ["activestorage"]
deps: ["activestorage-parity-enrollment-and-package"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The analyzer and previewer tests shell out: `ffprobe` (`analyzer/video_analyzer.rb`,
`audio_analyzer.rb:73-75`), `ffmpeg` (`previewer/video_previewer.rb:12-20`),
`mutool` (`previewer/mupdf_previewer.rb:14-24`) and `pdftoppm`
(`previewer/poppler_pdf_previewer.rb:14-22`). RFC 0203's land story already
installs ImageMagick on the runner. Rails' CI image carries all four.

## Acceptance criteria

- The activestorage CI job installs ffmpeg, mupdf-tools and poppler-utils, and
  a step prints each binary's version.
- No test is skipped on CI for a missing binary.

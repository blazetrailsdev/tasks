---
title: "Port Analyzer, NullAnalyzer, ImageAnalyzer (ImageMagick and Vips), Blob::Analyzable and AnalyzeJob"
status: done
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: as-analysis
packages: ["activestorage"]
deps:
  [
    "activestorage-blob-and-downloader",
    "mini-magick-typecheck-clean",
    "image-processing-vips-backend-over-wasm-vips",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9537
claim: "2026-10-31T16:16:46Z"
assignee: "activestorage-image-analyzers"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/analyzer.rb` (50: `accept?`, `analyze_later?`,
`metadata`, `download_blob_to_tempfile`, `instrument`),
`analyzer/null_analyzer.rb` (17), `analyzer/image_analyzer.rb` (29),
`image_analyzer/image_magick.rb` (41, `MiniMagick::Image.new(file.path)`) and
`image_analyzer/vips.rb` (47, `::Vips::Image.new_from_file`).
`app/models/active_storage/blob/analyzable.rb` (62: `analyze`,
`analyze_later`, `analyzed?`, `analyzer_class`) and
`app/jobs/active_storage/analyze_job.rb` (13). Tests:
`test/analyzer/image_analyzer/{image_magick,vips}_test.rb` (5 + 5),
`test/jobs/analyze_job_test.rb` (1).

## Acceptance criteria

- The ImageMagick analyzer calls `@blazetrails/mini-magick`; the Vips analyzer
  calls wasm-vips, initialised by RFC 0202's Vips backend.
- `analyze`, `analyze_later` and `AnalyzeJob#perform` are async.
- The three test files pass.

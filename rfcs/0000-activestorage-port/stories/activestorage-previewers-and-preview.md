---
title: "Port Previewer, the MuPDF, Poppler and video previewers, Preview and PreviewImageJob"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-previews
packages: ["activestorage"]
deps:
  [
    "activestorage-variation-and-variants",
    "ruby-compat-io-popen",
    "activestorage-ci-media-binaries",
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/previewer.rb` (101: `accept?`, `preview`,
`download_blob_to_tempfile`, `draw` (`:49-57`), `open_tempfile`, `capture`
(`:78-91`, `IO.popen` + `$?`), `instrument`, `service_name`),
`previewer/mupdf_previewer.rb` (40, `mutool draw`), `poppler_pdf_previewer.rb`
(39, `pdftoppm`), `video_previewer.rb` (36, `ffmpeg` with
`ActiveStorage.video_preview_arguments`). `app/models/active_storage/preview.rb`
(131: `processed`, `image`, `url`, `key`, `download`, `process`, `variant`) and
`app/jobs/active_storage/preview_image_job.rb` (16). Tests:
`test/previewer/{mupdf,poppler_pdf,video}_previewer_test.rb` (4 + 4 + 2),
`test/models/preview_test.rb` (11), `test/jobs/preview_image_job_test.rb` (2).

## Acceptance criteria

- The previewers shell out through ruby-compat `IO.popen`, honouring
  `ActiveStorage.paths`, and raise `PreviewError` with Rails' message on a
  non-zero exit.
- `Preview#processed` and `PreviewImageJob#perform` are async.
- The five test files pass against CI's mutool, pdftoppm and ffmpeg.

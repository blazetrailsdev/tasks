---
title: "Port ImageProcessing::MiniMagick over the mini_magick port"
status: draft
updated: 2026-10-21
rfc: "0202-image-processing-port"
cluster: ip-backends
packages: ["image-processing"]
deps: ["image-processing-pipeline-and-processor", "mini-magick-port"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`lib/image_processing/mini_magick.rb` (260 lines) drives `MiniMagick::Tool`
(`magick convert …`): `load_image` / `save_image`, the `resize_*` macros as
ImageMagick geometry, `crop`, `rotate`, `composite`, `define`, `limits`, and
any other name appended as a CLI option. Its tests are
`test/mini_magick_test.rb` (73 examples), comparing outputs with
`assert_similar` (perceptual hash).

## Acceptance criteria

- The backend is ported over `@blazetrails/mini-magick`; an unknown operation is
  appended as an ImageMagick option, as the gem does.
- `mini_magick_test.rb` passes, using the perceptual-hash helper
  (`image-processing-perceptual-hash-test-helper`).

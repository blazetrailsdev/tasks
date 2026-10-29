---
title: "Port ImageProcessing::MiniMagick over the mini_magick port"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: ip-backends
packages: ["image-processing"]
deps: ["image-processing-pipeline-and-processor", "mini-magick-typecheck-clean"]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9438
claim: "2026-10-29T14:34:07Z"
assignee: "image-processing-mini-magick-backend"
blocked-by: null
---

## Context

`lib/image_processing/mini_magick.rb` (260 lines) drives `MiniMagick::Tool`
(`magick convert …`): `load_image` / `save_image`, the `resize_*` macros as
ImageMagick geometry, `crop`, `rotate`, `composite`, `define`, `limits`, and
any other name appended as a CLI option. `MiniMagick::Tool` is ported by RFC
0203 at `packages/mini-magick/src/tool.ts`, async from `Shell#execute` up, with
`Tool#method_missing` as a Proxy, so an appended option is the same
`tool.<option>(…)` call Ruby makes. Its tests are
`test/mini_magick_test.rb` (73 examples), comparing outputs with
`assert_similar` (perceptual hash).

## Acceptance criteria

- The backend is ported over `@blazetrails/mini-magick` (a workspace
  dependency, no new mini_magick code here); an unknown operation is appended
  as an ImageMagick option, as the gem does, and every `Tool` call is awaited.
- `mini_magick_test.rb` passes, using the perceptual-hash helper
  (`image-processing-perceptual-hash-test-helper`).

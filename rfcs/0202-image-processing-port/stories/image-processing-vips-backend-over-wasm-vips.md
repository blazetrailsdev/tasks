---
title: "Port ImageProcessing::Vips over wasm-vips"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: ip-backends
packages: ["image-processing"]
deps: ["image-processing-pipeline-and-processor"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9438
claim: "2026-10-29T14:34:07Z"
assignee: "image-processing-mini-magick-backend"
blocked-by: null
---

## Context

`lib/image_processing/vips.rb` (228 lines) is ruled to wrap npm `wasm-vips`
(2026-10-21, switched from sharp the same day). wasm-vips binds the same
libvips object model as ruby-vips, so the port is call for call: the RFC's
Design table lists the names (`Image.newFromFile`, `thumbnailImage`,
`autorot`, `similarity`, `gravity`, `composite`, `conv` with `SHARPEN_MASK` at
`vips.rb:22-24`, `writeToFile`, the metadata setters at `vips.rb:149-152`).
`add_alpha` is Ruby in ruby-vips, ported over `bandjoin`. A queued operation
outside `vips.rb`'s methods (`processor.rb:60`, `public_send`) is the `Image`
method of that libvips name.

`vips.rb:4` refuses libvips older than 8.6
(`Vips.at_least_libvips?(8, 6)`); wasm-vips reports its libvips version.
Loader / saver option introspection (`vips.rb:198-226`) follows the RFC's open
question 1.

## Acceptance criteria

- `wasm-vips` is an optional peer of `@blazetrails/image-processing`; the
  module is initialised once (it is async) before the first pipeline runs.
- Each Vips processor method makes the wasm-vips calls ruby-vips makes, under
  the same names camelCased; a queued name dispatches to that `Image` method,
  and an unknown one raises libvips' error as in Ruby.
- `vips_test.rb` (74 examples) passes with its expected images built through
  wasm-vips as the Ruby test builds them through ruby-vips; each remaining skip
  is a `PERMANENT-SKIP` citing a ruling.

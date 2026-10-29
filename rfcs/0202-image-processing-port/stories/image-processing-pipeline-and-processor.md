---
title: "Port ImageProcessing::Pipeline and Processor"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: ip-core
packages: ["image-processing"]
deps: ["image-processing-chainable-thenable-proxy"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9433
claim: "2026-10-29T14:05:29Z"
assignee: "image-processing-chainable-builder-module-cycle"
blocked-by: null
---

## Context

`Pipeline` (`pipeline.rb`, 103 lines) requires a source
(`fail Error, "source file is not provided"`, `:11`), resolves the source path
and format, runs the processor and saves to a destination or a Tempfile
(`call(save: true)`, `:19`). `Processor` (`processor.rb`, 72 lines) is the
backend base: `accumulator` (`:32`, `define_method(name) { @accumulator }`),
`apply_operation` (`:60-62`, `receiver.public_send(name, …)`), and the
class-level `load_image` / `save_image` hooks each backend defines.

## Acceptance criteria

- `Pipeline` and `Processor` are ported; file IO and processing are async from
  the start, the builder chain stays sync until `call` / `await`.
- `apply_operation` sends a queued name to the backend's receiver as Ruby's
  `public_send` does: the wasm-vips `Image` method of that libvips name, or an
  ImageMagick option for MiniMagick.
- `pipeline_test.rb` (29 examples) passes against the MiniMagick backend.

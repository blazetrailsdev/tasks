---
title: "Port ImageProcessing::Pipeline and Processor"
status: draft
updated: 2026-10-21
rfc: "0202-image-processing-port"
cluster: ip-core
packages: ["image-processing"]
deps: ["image-processing-chainable-thenable-proxy"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
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
- `apply_operation` dispatches a queued name to the backend's mapping (see the
  backend stories), raising `ImageProcessing::Error` for a name the backend has
  no form for, per the RFC's open question 1 once ruled.
- `pipeline_test.rb` (29 examples) passes against the MiniMagick backend.

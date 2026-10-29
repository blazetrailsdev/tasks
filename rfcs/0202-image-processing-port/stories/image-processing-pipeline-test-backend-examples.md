---
title: "image-processing-pipeline-test-backend-examples"
status: draft
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps:
  - image-processing-vips-backend-over-wasm-vips
  - image-processing-mini-magick-backend
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Processor` landed in trails#9433 and `Pipeline` in trails#9426. `packages/image-processing/src/pipeline.test.ts` ports only the `pipeline_test.rb` examples that need no backend: 10 of the 29 in `vendor/image_processing/v1.14.0/test/pipeline_test.rb`. The other 19 call `ImageProcessing::Vips` or `ImageProcessing::MiniMagick`, among them "accepts format" (`:22`), "makes sure the destination file is deleted on processing errors" (`:62`), "accepts a list of commands" (`:113`), "applies a custom block" (`:153`), "returns an intermediary object on #call(save: false)" (`:234`) and "doesn't allow making system calls" (`:262`).

## Acceptance criteria

- Port every remaining `pipeline_test.rb` example with its Rails name verbatim, over the ported backends.
- "raises exception when invalid source was provided" (`:250`) passes `:invalid`, a Symbol. In trails that is a JS string, so it would read as a path. Port the assertion with a source value that is neither a String nor the accumulator class, and cite the Symbol rule in CLAUDE.md.

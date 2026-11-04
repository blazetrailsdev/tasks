---
title: "image-processing-wasm-vips-handle-lifetime"
status: draft
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
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

`ImageProcessing::Vips` relies on Ruby's GC to free a `Vips::Image`. ruby-vips registers libvips' tracked memory with the GC, so a large decode is collected under memory pressure (`vendor/image_processing/v1.14.0/lib/image_processing/vips.rb`, `processor.rb:11-35`).

A wasm-vips handle releases its libvips references only on `delete()`. Measured on trails#9710:

- Neither `setAutoDeleteLater` + `setDelayFunction` nor a forced V8 GC released them.
- Each `loader(page: 0)` transform of a 4032×2688 JPEG kept ~34 MB in the wasm heap.
- The activestorage AR-lane runs then hit "vips_tracked: out of memory".

trails#9710 frees the handles explicitly:

- `Processor.call` deletes superseded and saved accumulators through the module-private `deleteAccumulator` (`packages/image-processing/src/processor.ts`).
- `Vips::Processor.load_image` / `#thumbnail` delete their pre-`autorot` / pre-sharpen intermediates (`packages/image-processing/src/vips.ts`).

Each carries `@inventedArm … — CONVERGEABLE image-processing-wasm-vips-handle-lifetime`.

## Acceptance criteria

- Either a repo-owner ruling ratifies explicit wasm-vips handle deletion as a language/runtime shortcoming, recorded in a CLAUDE.md section, with the receipts turned `PERMANENT` against it;
- or a mechanism that frees handles without invented calls in the ported bodies (e.g. a wasm-vips build whose handles are released by finalization under memory pressure) replaces them, and the receipts and `deleteAccumulator` are removed.
- The other vips operations that leave intermediates (`resizeAndPad`, `composite`, `resizeToCover`) are covered by whichever answer lands.

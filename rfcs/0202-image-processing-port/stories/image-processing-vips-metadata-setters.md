---
title: "image-processing-vips-metadata-setters"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9440
claim: "2026-10-29T16:07:40Z"
assignee: "image-processing-backend-tests-remainder"
blocked-by: null
closed-reason: null
---

## Context

`vendor/image_processing/v1.14.0/lib/image_processing/vips.rb:149-152` makes `set`, `set_type`, `set_value`, `remove` chainable. wasm-vips has `setInt` / `setDouble` / `setString` / `setBlob` / `getTypeof` / `remove` but no generic `set` / `set_type` / `set_value`; `packages/image-processing/src/vips.ts` ports only `remove`.

## Acceptance criteria

- `set`, `setType`, `setValue` are ported on `ImageProcessing::Vips::Processor`, dispatching on the GType as ruby-vips' `Image#set_type` does.
- `vips_test.rb` "allows changing metadata" passes.

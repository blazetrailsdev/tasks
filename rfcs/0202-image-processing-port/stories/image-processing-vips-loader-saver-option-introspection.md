---
title: "image-processing-vips-loader-saver-option-introspection"
status: in-progress
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

`vendor/image_processing/v1.14.0/lib/image_processing/vips.rb:198-226` (`Utils.select_valid_loader_options` / `select_valid_saver_options` / `select_valid_options`) filters loader/saver options through `Vips.vips_foreign_find_load` / `_save` and `Vips::Introspect`. wasm-vips exposes neither, so `packages/image-processing/src/vips.ts` `loadImage` / `saveImage` pass every option straight through (receipted `@missingRailsCall ... CONVERGEABLE image-processing-vips-loader-saver-option-introspection`). RFC 0202 open question 1 recommends a static per-format option list.

## Acceptance criteria

- `Processor.Utils` ports the three Rails methods; `loadImage` / `saveImage` call them as `vips.rb:39,58` do.
- The `@missingRailsCall` receipts are removed.
- `vips_test.rb` "ignores loader options that are not defined" and "ignores saver options that are not defined" pass.

---
title: "wasm-vips-magickload-for-psd-ico-bmp"
status: ready
updated: 2026-11-03
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

Rails' dummy app runs `config.load_defaults`, so `ActiveStorage.variant_processor`
is `:vips` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:257`).
The variant tests "resized variation of PSD blob", "resized variation of ICO blob"
and "resized variation of BMP blob"
(`vendor/rails/v8.0.2/activestorage/test/models/variant_test.rb:72-110`) process
`icon.psd`, `favicon.ico` and `colors.bmp` under vips. libvips loads those through
`magickload`; the npm `wasm-vips` build behind `packages/image-processing/src/vips.ts`
has no ImageMagick loader and raises `vips::Error, unable to load from file`.
The three tests are `it.skip` in `packages/activestorage/src/variant.test.ts` under
a `BLOCKED: wasm-vips-magickload-for-psd-ico-bmp` line.

## Acceptance criteria

- `ImageProcessing::Vips` loads PSD, ICO and BMP sources (a magick fallback the
  way libvips' `magickload` does, without a new runtime dependency).
- The three tests are un-skipped and pass.

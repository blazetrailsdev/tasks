---
title: "activestorage-vips-block-untrusted-loaders"
status: ready
updated: 2026-11-24
rfc: "0256-rails-8-0-5-2-burn-down"
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

Rails v8.0.5.2 adds `activestorage/lib/active_storage/vips.rb` (required by `analyzer/image_analyzer/vips.rb:3`): it loads `image_processing/vips` first, raises unless `Vips.respond_to?(:block_untrusted)`, then calls `Vips.block_untrusted(true)` (`vips.rb:25-41`), so libvips' unfuzzed loaders (SVG, ImageMagick-backed PSD/ICO/BMP) are off by default. trails has no counterpart; wasm-vips exposes `vips.blockUntrusted(state)` (`packages/image-processing/node_modules/wasm-vips/lib/vips.d.ts:98`).

Upstream replaced tests accordingly; the old ones were deleted in trails#10689:

- `test/analyzer/image_analyzer/vips_test.rb:29,39`: "analyzing an SVG image without an XML declaration is skipped because the SVG loader is disabled by default" / "... when the SVG loader is enabled".
- `test/models/variant_test.rb:83,91,105,113,138,146`: "resized variation of {PSD,ICO,BMP} blob raises because the ImageMagick loader is disabled by default" / "... when the ImageMagick loader is enabled".
  These use `with_vips_loaders_enabled`, `VIPS_SVG_LOADERS` and `VIPS_MAGICK_LOADERS` from `test/test_helper.rb`.

## Acceptance criteria

- [ ] `lib/vips.ts` ports `vips.rb` (block untrusted loaders after image_processing loads; raise with Rails' message when unavailable), loaded from the Vips analyzer as Rails requires it.
- [ ] The test helpers `withVipsLoadersEnabled`, `VIPS_SVG_LOADERS` and `VIPS_MAGICK_LOADERS` are ported.
- [ ] The 8 renamed upstream tests are ported, or each one is parked with a cited reason (for example, a loader missing from the wasm-vips build).

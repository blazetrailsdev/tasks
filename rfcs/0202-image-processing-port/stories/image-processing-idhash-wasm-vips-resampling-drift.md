---
title: "IDHash distances under wasm-vips' libvips 8.18 agree with dhash-vips' assert_similar verdicts"
status: ready
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps:
  - image-processing-vips-backend-over-wasm-vips
  - image-processing-mini-magick-backend
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/image-processing/src/test-helpers/dhash-vips.ts` ports dhash-vips 0.2.5.0's `IDHash.fingerprint` (`lib/dhash-vips.rb:105-125`) bit-exact over the same 8×8 thumbnail. However, wasm-vips 0.0.19 ships libvips 8.18, and its `Image.thumbnail(..., size: "force")` resamples ±1 per pixel differently from native libvips 8.15. Distances therefore shift by 1–3 against the gem's numbers. portrait.jpg / fill.jpg is 2 on native and 4 under wasm-vips, which crosses `assert_similar`'s threshold of 3 (`image_processing/v1.14.0/test/test_helper.rb:29-35`). `dhash-vips.trails.test.ts` pins 7 pairs whose verdicts agree.

## Acceptance criteria

- When `vips_test.rb` / `mini_magick_test.rb` are ported, every `assert_similar` / `refute_similar` gives the gem's verdict under wasm-vips.
- If any flips, match the gem's thumbnail (e.g. pin the libvips resampling kernel via `Image.thumbnail` options), and keep the threshold at 3 as `test_helper.rb` sets it.

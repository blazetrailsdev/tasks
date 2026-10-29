---
title: "image-processing-mini-magick-tests-remainder"
status: in-progress
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9448
claim: "2026-10-29T19:20:00Z"
assignee: "image-processing-mini-magick-tests-remainder"
blocked-by: null
closed-reason: null
---

## Context

`packages/image-processing/src/vips.test.ts` now ports all 74 examples of `vendor/image_processing/v1.14.0/test/vips_test.rb`. `packages/image-processing/src/mini-magick.test.ts` still ports only 10 of the 73 examples in `vendor/image_processing/v1.14.0/test/mini_magick_test.rb`; the rest did not fit under the PR ceiling alongside the vips port. `assertType` (`test_helper.rb:41-43`) is now in `src/test-helpers/test-helper.ts`, and `exif_portrait.jpg` is in the fixtures.

## Acceptance criteria

- Every remaining `mini_magick_test.rb` example is ported into `mini-magick.test.ts` with its Rails name verbatim, in Rails order (split by describe block across PRs if needed).
- Each `assert_similar` / `refute_similar` gives the gem's verdict under wasm-vips' IDHash; a skip is a `PERMANENT-SKIP` citing a CLAUDE.md ruling.

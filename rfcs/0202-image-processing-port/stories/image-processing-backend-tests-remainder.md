---
title: "image-processing-backend-tests-remainder"
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

trails#<this PR> ported `ImageProcessing::MiniMagick` and `ImageProcessing::Vips` (`packages/image-processing/src/mini-magick.ts`, `vips.ts`) with only a slice of their tests under the 800-LOC ceiling: `vendor/image_processing/v1.14.0/test/mini_magick_test.rb` (73 examples) and `test/vips_test.rb` (74 examples). Ported so far live in `packages/image-processing/src/mini-magick.test.ts` / `vips.test.ts`.

## Acceptance criteria

- Every remaining example of both Rails test files is ported, verbatim names, in the existing test files (split across PRs by describe block as size requires).
- Each skip is a `PERMANENT-SKIP` citing a ruling, or a `deps` on the story that unblocks it (`image-processing-vips-loader-saver-option-introspection`, `image-processing-vips-metadata-setters`).

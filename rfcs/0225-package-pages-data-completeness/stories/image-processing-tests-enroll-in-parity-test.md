---
title: "parity:test: enroll image_processing's test/ so /packages/image-processing gets a tests tile"
status: draft
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: test-enrollment
packages: ["image-processing", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:482-494` vendors image_processing v1.14.0 with
`compareTests: false`, so `/packages/image-processing` has no tests tile.
`vendor/image_processing/v1.14.0/test/` holds `builder_test.rb`,
`mini_magick_test.rb`, `pipeline_test.rb` and `vips_test.rb`, and
`packages/image-processing/test/` already has `builder.test.ts`,
`mini-magick.test.ts`, `pipeline.test.ts` and `vips.test.ts`. api was enrolled
by trails#9825.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `image-processing` gets `testPath` and
      `compareTests: true`, in the same shape as mini_mime's entry
      (`vendor/sources.ts:1009-1013`). Its `testsExcludedReason` from
      `sources-tests-excluded-reason` is deleted.
- [ ] `vendor/sources.test.ts` asserts that `testPathsManifest()` contains the
      key, as it already does for `rack-session` (`:80`).
- [ ] Each Ruby test file with no TS counterpart is a row in
      `scripts/parity/unported-files/<key>.ts`, which `test-compare/compare.ts`
      reads through `isTestFileUnported`. A row is a whole file, never a glob.
- [ ] `pnpm parity:test` writes a row under the key, and every other
      package's delta is zero. No tests are ported here: a low percentage is
      expected, because this story adds the tile, not the coverage.

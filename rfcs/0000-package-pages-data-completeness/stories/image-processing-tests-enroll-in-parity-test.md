---
title: "parity:test: enroll image_processing's test/ so /packages/image-processing gets a tests tile"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
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

- [ ] `testPath: "test"`, `compareTests: true`, registered in
      `scripts/test-compare/` like `sqlite3-gem-tests-enroll-in-parity-test`.
      `vendor/sources.test.ts`'s `testPathsManifest` lists it.
- [ ] `pnpm parity:test` reports an `image-processing` row. Every other
      package's delta is zero.
- [ ] No tests are ported here. A low percentage is expected.

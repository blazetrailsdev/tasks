---
title: "parity:test: enroll rails-html-sanitizer, loofah and crass tests under html-sanitizer"
status: draft
updated: 2026-11-07
rfc: "0225-package-pages-data-completeness"
cluster: test-enrollment
packages: ["html-sanitizer", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:676-717` vendors rails-html-sanitizer v1.6.2, loofah
v2.24.0 and crass v1.0.6, all ported by `html-sanitizer`
(`PACKAGE_DIR_OVERRIDES`, `scripts/api-compare/config.ts:52-54`) and all
`compareTests: false`. The Ruby tests are rails-html-sanitizer
`test/{rails_api,sanitizer,scrubbers}_test.rb`, 14 loofah files and 8 crass
files. `packages/html-sanitizer/test/` already has `rails-api.test.ts`,
`full-sanitizer.test.ts`, `safe-list-sanitizer.test.ts`, and `loofah/` and
`crass/` subtrees. The package has an api tile (trails#9825) but no tests tile.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `rails-html-sanitizer`, `loofah` and `crass` each get `testPath` and
      `compareTests: true`, in the same shape as mini_mime's entry
      (`vendor/sources.ts:1009-1013`). Each `testsExcludedReason` from
      `sources-tests-excluded-reason` is deleted.
- [ ] `vendor/sources.test.ts` asserts that `testPathsManifest()` contains each
      key, as it already does for `rack-session` (`:80`).
- [ ] Each Ruby test file with no TS counterpart is a row in
      `scripts/parity/unported-files/<key>.ts`, which `test-compare/compare.ts`
      reads through `isTestFileUnported`. A row is a whole file, never a glob.
- [ ] The three keys roll up into `/packages/html-sanitizer` through
      `compareKeysOf("html-sanitizer")`.
- [ ] `pnpm parity:test` writes a row under each key, and every other
      package's delta is zero. No tests are ported here: a low percentage is
      expected, because this story adds the tile, not the coverage.

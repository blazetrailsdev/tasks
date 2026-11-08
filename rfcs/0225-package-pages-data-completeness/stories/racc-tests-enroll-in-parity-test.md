---
title: "parity:test: enroll racc tests under the nokogiri package"
status: done
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: test-enrollment
packages: ["nokogiri", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9868
claim: "2026-11-08T14:15:25Z"
assignee: "html-sanitizer-gems-tests-enroll-in-parity-test"
blocked-by: null
---

## Context

`vendor/sources.ts:658-671` vendors racc v1.8.0 (10 test `.rb` files) with
`compareTests: false`. It is ported inside `packages/nokogiri/lib/racc`
(`PACKAGE_DIR_OVERRIDES`, `scripts/api-compare/config.ts:51`). trails#9825
enrolled its api (10/434); it has no tests tile. Split from
`nokogiri-tests-enroll-in-parity-test` so that each story stays well under the
ceiling.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `racc` gets `testPath` and
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

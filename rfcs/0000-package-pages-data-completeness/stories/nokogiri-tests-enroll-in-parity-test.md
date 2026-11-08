---
title: "parity:test: enroll nokogiri tests under the nokogiri package"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: test-enrollment
packages: ["nokogiri", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:641-671` vendors nokogiri v1.18.3 (103 test `.rb` files) with `compareTests: false`. racc is
`racc-tests-enroll-in-parity-test`. `packages/nokogiri/test/` has
seven test files (`sax/parser`, `xml/document`, `css/{parser,tokenizer,xpath-visitor}`,
`html5/document`, plus one `.trails.test.ts`). trails#9825 enrolled api (190/597); there is no tests tile.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `nokogiri` gets `testPath` and
      `compareTests: true`, in the same shape as mini_mime's entry
      (`vendor/sources.ts:1009-1013`). Its `testsExcludedReason` from
      `sources-tests-excluded-reason` is deleted.
- [ ] `vendor/sources.test.ts` asserts that `testPathsManifest()` contains the
      key, as it already does for `rack-session` (`:80`).
- [ ] Each Ruby test file with no TS counterpart is a row in
      `scripts/parity/unported-files/<key>.ts`, which `test-compare/compare.ts`
      reads through `isTestFileUnported`. A row is a whole file, never a glob.
- [ ] About 96 of the 103 files are unported rows, one line each. `est-loc`
      450 counts those rows plus the sources and test edits.
- [ ] `pnpm parity:test` writes a row under the key, and every other
      package's delta is zero. No tests are ported here: a low percentage is
      expected, because this story adds the tile, not the coverage.

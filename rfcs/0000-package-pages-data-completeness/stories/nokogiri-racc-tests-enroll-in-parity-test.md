---
title: "parity:test: enroll nokogiri and racc tests under the nokogiri package"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: test-enrollment
packages: ["nokogiri", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:641-671` vendors nokogiri v1.18.3 (103 test `.rb` files) and
racc v1.8.0 (10), both with `compareTests: false`. `packages/nokogiri/test/` has
seven test files (`sax/parser`, `xml/document`, `css/{parser,tokenizer,xpath-visitor}`,
`html5/document`, plus one `.trails.test.ts`). trails#9825 enrolled api (190/597
and 10/434); there is no tests tile.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `nokogiri` and `racc` each get `testPath` and
      `compareTests: true`, in the same shape as mini_mime's entry
      (`vendor/sources.ts:1009-1013`). Each `testsExcludedReason` from
      `sources-tests-excluded-reason` is deleted.
- [ ] `vendor/sources.test.ts` asserts that `testPathsManifest()` contains each
      key, as it already does for `rack-session` (`:80`).
- [ ] Each Ruby test file with no TS counterpart is a row in
      `scripts/parity/unported-files/<key>.ts`, which `test-compare/compare.ts`
      reads through `isTestFileUnported`. A row is a whole file, never a glob.
- [ ] nokogiri has 103 test files, so most of them are unported rows. If
      nokogiri's and racc's rows together push the PR past the LOC ceiling,
      enroll nokogiri here and file `racc-tests-enroll-in-parity-test` with
      `tasks new`.
- [ ] `pnpm parity:test` writes a row under each key, and every other
      package's delta is zero. No tests are ported here: a low percentage is
      expected, because this story adds the tile, not the coverage.

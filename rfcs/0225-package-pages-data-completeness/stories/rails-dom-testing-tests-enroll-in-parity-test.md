---
title: "parity:test: enroll rails-dom-testing's tests under actionview"
status: draft
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: test-enrollment
packages: ["actionview", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:624-636` vendors rails-dom-testing v2.2.0 with
`compareTests: false`. It is ported inside actionview
(`packages/actionview/src/rails-dom-testing/assertions/`, which has
`selector-assertions.test.ts` and `dom-assertions.trails.test.ts`), and
`compareKeysOf("actionview")` includes `rails-dom-testing`. The Ruby tests are
`test/{dom_assertions,parser_selection,selector_assertions}_test.rb`. So
actionview's tests tile leaves out this gem entirely.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `rails-dom-testing` gets `testPath` and
      `compareTests: true`, in the same shape as mini_mime's entry
      (`vendor/sources.ts:1009-1013`). Its `testsExcludedReason` from
      `sources-tests-excluded-reason` is deleted.
- [ ] `vendor/sources.test.ts` asserts that `testPathsManifest()` contains the
      key, as it already does for `rack-session` (`:80`).
- [ ] Each Ruby test file with no TS counterpart is a row in
      `scripts/parity/unported-files/<key>.ts`, which `test-compare/compare.ts`
      reads through `isTestFileUnported`. A row is a whole file, never a glob.
- [ ] trailmap sums the `rails-dom-testing` row into actionview's tile
      through `compareKeysOf("actionview")`, and actionview's own row has a
      zero delta.
- [ ] `pnpm parity:test` writes a row under the key, and every other
      package's delta is zero. No tests are ported here: a low percentage is
      expected, because this story adds the tile, not the coverage.

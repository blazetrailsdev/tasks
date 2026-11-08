---
title: "parity:test: enroll tzinfo's test/ so /packages/tzinfo gets a tests tile"
status: draft
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: test-enrollment
packages: ["tzinfo", "scripts"]
deps: [sources-tests-excluded-reason, tzinfo-port-mirrors-lib-tzinfo-files]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:857-868` vendors tzinfo v2.0.6 (trails#9825) with
`compareTests: false`. `vendor/tzinfo/v2.0.6/test/` has 92 `.rb` files.
`packages/tzinfo/` is one `lib/index.ts` with one `test/index.trails.test.ts`.
`tzinfo-port-mirrors-lib-tzinfo-files` (0223) splits the port into the
`lib/tzinfo/*.rb` layout. Until that lands, convention mapping has no TS paths
to pair with, so this story depends on it.

## Acceptance criteria

- [ ] In `vendor/sources.ts`, `tzinfo` gets `testPath` and
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

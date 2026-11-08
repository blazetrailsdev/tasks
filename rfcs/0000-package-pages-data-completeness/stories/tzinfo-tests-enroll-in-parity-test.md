---
title: "parity:test: enroll tzinfo's test/ so /packages/tzinfo gets a tests tile"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
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

- [ ] `testPath: "test"`, `compareTests: true`, registered in
      `scripts/test-compare/`.
- [ ] Unported test files are `unported-files` rows.
- [ ] `pnpm parity:test` reports a `tzinfo` row. Every other package's delta
      is zero.

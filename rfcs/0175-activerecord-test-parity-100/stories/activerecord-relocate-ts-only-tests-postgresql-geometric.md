---
title: "activerecord: move the 22 TS-only tests in adapters/postgresql/geometric.test.ts to its .trails sibling"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 560
priority: null
pr: trails#8842
claim: "2026-10-13T01:10:59Z"
assignee: "activerecord-relocate-ts-only-tests-postgresql-geometric"
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-relocate-ts-only-tests-adapters-postgresql`, whose PR moved the extras of
eight files and stopped at the LOC ceiling. A pure move costs each line twice.

`packages/activerecord/src/adapters/postgresql/geometric.test.ts` still reports **22 extra (TS only)**
in `pnpm parity:test`. All 22 sit in `describe("PostgreSQLGeometricTypesTest")`, lines 197-466:
`line column`, `line default`, `line type cast`, `line write`, `lseg column`, `lseg type cast`,
`lseg write`, `box column`, `box type cast`, `box write`, `path column`, `path open`, `path closed`,
`path type cast`, `path write`, `polygon column`, `polygon type cast`, `polygon write`,
`circle column`, `circle type cast`, `circle write`, `geometric nil`.

Rails' `PostgreSQLGeometricTypesTest`
(`vendor/rails/v8.0.2/activerecord/test/cases/adapters/postgresql/geometric_test.rb`) holds only the
seven `creating column with <type> type` tests, which stay. Every Rails test in the file is already
matched (0 missing), so none of the 22 is a Rails test under a drifted name.

Each of the 22 creates and drops `test_geometric_types` itself and needs only `adapter`
(`Base.leaseConnection()`, `fixtures({}, { useTransactionalTests: false })`) and the describe's
`afterEach` drop of `test_geometric_types`. That `afterEach` moves with them: the seven Rails tests
use `testings`.

About 270 lines move, so the PR is about 560 LOC.

## Acceptance criteria

- [ ] The 22 tests move unchanged to `geometric.trails.test.ts`, with the `afterEach` that drops `test_geometric_types`.
- [ ] `geometric.test.ts` reports 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```

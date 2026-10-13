---
title: "activerecord: move the 31 TS-only tests in query-logs, suppressor, enum, transaction-callbacks and json-serialization test files to .trails siblings"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: []
deps: []
deps-rfc: []
est-loc: 690
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-relocate-ts-only-tests-root-part-2`, whose PR cleared 12 of that
story's files and stopped at the LOC ceiling: a moved test counts once as a deletion and once
as an addition, so the remaining extras did not fit in one PR.

`pnpm parity:test` still counts these TS-only extras in Rails-named root test files
(extras per file, with the line count of the test bodies as measured on main after that PR):

- `packages/activerecord/src/query-logs.test.ts`: 13 (66 lines)
- `packages/activerecord/src/suppressor.test.ts`: 6 (58 lines)
- `packages/activerecord/src/enum.test.ts`: 4 (68 lines)
- `packages/activerecord/src/transaction-callbacks.test.ts`: 4 (81 lines)
- `packages/activerecord/src/json-serialization.test.ts`: 4 (40 lines)

The per-test names are not printed by the report. `scripts/test-compare/compare.ts` computes
the count as `tsTests.length - consumedTs.size` after the per-file match loop, and index `i`
there is the index into that file's `testCases` in
`scripts/test-compare/output/ts-tests.json`, which carries each test's `line`. A throwaway
`console.error` of the unconsumed indices at that point lists every extra with its line.

The `query-logs.test.ts` extras are whole describes (`GetKeyHandler`, `LegacyFormatter`,
`QueryLogs.tagsFormatter`, `QueryLogs handlers`, `SQLCommenter`), and the six
`suppressor.test.ts` extras are the whole `Suppressor.registry` describe, so those move as
blocks. `enum.trails.test.ts` exists; the other four siblings do not.

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path, matched to Rails'
      name and path without renaming a Rails-named test; (b) a duplicate of a ported Rails
      test, deleted; or (c) TS-only, moved to the `.trails.test.ts` sibling.
- [ ] A moved test that used `as any` is retyped: the `.trails.test.ts` files are linted
      with `no-explicit-any` on, and the Rails-named files are not.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```

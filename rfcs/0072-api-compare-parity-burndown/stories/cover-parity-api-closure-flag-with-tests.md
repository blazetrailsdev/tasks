---
title: "Cover parity:api --closure with tests — the row filter and its totals line ship unverified"
status: done
updated: 2026-08-11
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6368
claim: "2026-08-11T16:13:43Z"
assignee: "naming-burndown-ar-field-and-body-restructures"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #6362, which landed
`scope-parity-api-detail-to-the-ar-closure`: `pnpm parity:api --closure`
scopes the per-file detail table to `ar-closure.json`'s file set and prints an
`in AR closure: …` totals line.

The flag ships with **no automated test**. `printReport` in
`scripts/api-compare/compare.ts` is a module-private function that writes to
`console.log`, so nothing in `scripts/api-compare/compare.test.ts` can reach
the filtering logic (`closureFileSet` / `detailFiles`) or the totals line.
It was verified by hand only: `--package activesupport --closure` prints
`in AR closure: 559/1226 methods (45.6%) | files: 116`, matching the existing
`AR closure` rollup exactly, and the whole-package / Data-layer / AR-closure
summaries are byte-identical with and without the flag.

That hand-check is exactly the invariant a future change to `printReport`
would silently break — the flag's whole contract is "filters rows, never
denominators".

Tooling file, no Rails counterpart (RFC 0072 infra).

## Converged shape

Extract the closure row-filter into a testable unit (a small exported
`filterFilesToClosure(files, closureFiles, isDataLayer)` alongside
`ar-closure.ts`, or export `printReport` with an injectable sink) and cover:
the filter keeps data-layer packages whole, drops out-of-closure support-gem
rows, and leaves the summary totals untouched.

## Acceptance criteria

- [ ] A test asserts `--closure` restricts the per-file rows to
      `ar-closure.json`'s set for a support gem.
- [ ] A test asserts data-layer packages are NOT filtered.
- [ ] A test asserts the whole-package and Data-layer/AR-closure totals are
      identical with and without the flag.
- [ ] No new `scripts/` test directory (would need the three registrations);
      the tests live in the existing `scripts/api-compare/` suite.

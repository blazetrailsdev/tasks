---
title: "date: ten ported test names drop the leading space their test__x Rails name carries"
status: draft
updated: 2026-08-31
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `test-compare-underscore-run-name-collision` (PR #7309, RFC 0126),
which made a LEADING space significant in `parity:test`'s `normalize`
(`scripts/test-compare/compare.ts`) so `test__x` and `test_x` in one Ruby file
stop collapsing onto a single path.

The Ruby extractor derives a `def test_x` description with
`name.sub(/^test_/, "").tr("_", " ")`
(`scripts/test-compare/extract-ruby-tests.rb:648`), so a doubled leading
underscore IS a leading space in the Rails-derived name. Ten ported `date`
tests drop it, and today they credit only through the deliberate alias-index
fallback that PR added for a different case (an interpolation-derived leading
space, `activemodel .../i18n_validation_test.rb:374`):

- `packages/date/src/test-date-arith.test.ts:25,37,49,65,73` — `it("plus")`,
  `"plus ex"`, `"minus"`, `"minus ex"`, `"compare"` port
  `vendor/date/test/date/test_date_arith.rb:20,33,56,74,90`
  (`test__plus`, `test__plus__ex`, `test__minus`, `test__minus__ex`,
  `test__compare`) — verbatim names are `" plus"`, `" plus  ex"`, `" minus"`,
  `" minus  ex"`, `" compare"`.
- `packages/date/src/test-date-strftime.test.ts:434` — `it("different format")`
  ports `test__different_format` (`test_date_strftime.rb:358`) → `" different format"`.
- `packages/date/src/test-date.test.ts:205` — `it("const")` ports `test__const`
  (`test_date.rb:23`) → `" const"`.

The same file already spells the verbatim form where a sibling forced it —
`test-date-parse.test.ts:37` is `it(" parse")` next to `:1613`'s `it("parse")`
— so this is drift in the files that had no collision to force the issue, not
a convention.

## Converged shape

Rename each listed `it(...)` to the verbatim Rails-derived description
(leading space, and the doubled inner spaces where the Ruby name doubles the
underscore), matching what `test-date-parse.test.ts` already does. This is one
of the two sanctioned reasons to touch a test name: the current name is not the
Rails one.

## Acceptance criteria

- The ten names above are the verbatim `sub(/^test_/, "").tr("_", " ")` forms.
- `pnpm parity:test` totals do not regress for `date` (137/137 today).
- Each now matches on the exact key, not through `aliasKey`'s fallback — check
  by asserting the pairs still credit with the fallback disabled locally.

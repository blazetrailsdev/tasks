---
title: "A Ruby case is credited by a same-named test in another file and class"
status: draft
updated: 2026-09-05
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`core_ext/time_ext_test.rb` reported **0 missing** while
`TimeExtMarshalingTest#test_last_quarter_on_31st`
(`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:1422-1424`) had no
port in the convention file at all. Found while shipping
`port-core-ext-numeric-and-time-ext-cases` (#7500).

The Ruby manifest carries the case at its real path,
`TimeExtMarshalingTest > last quarter on 31st`
(`scripts/test-compare/output/rails-tests.json`). The convention TS file,
`packages/activesupport/src/core-ext/time-ext.test.ts`, had no `it("last quarter
on 31st")` anywhere. What credited it was a same-named case in a **different TS
file under a different class**:

- `packages/activesupport/src/time-ext.test.ts` — `TimeExtCalculationsTest > last quarter on 31st`
- and two more there under `DateExtCalculationsTest` / `DateTimeExtCalculationsTest`,
  which belong to `date_ext_test.rb` / `date_time_ext_test.rb`.

So a Ruby case was scored `matched` against a TS test that is neither in the
convention file nor in the same class — and it was not counted `misplaced`
either (that file reported 0 misplaced). Both counters read clean while the case
was genuinely absent.

This is a metric-correctness bug for this RFC specifically: a file can reach the
`✓` that `parity:test` prints, and be counted toward the AR-closure sub-metric,
with cases missing. Distinct from
`duplicate-test-paths-never-credit-past-the-first`, which is about duplicates
_inside_ one mapping crediting once; this is credit leaking _across_ files and
classes.

## Acceptance criteria

- A Ruby case is credited `matched` only by a TS test in the convention file for
  its Ruby file; a same-named test elsewhere either scores `misplaced` or does
  not score at all — never `matched`.
- Class/describe ancestry participates in the match, so
  `TimeExtMarshalingTest > x` cannot be satisfied by
  `TimeExtCalculationsTest > x`.
- A regression test in `scripts/test-compare/` fails on the current comparer:
  build a fixture where the convention file lacks a case and a sibling
  non-convention file has one with the same description, and assert it is
  reported missing.
- Re-measure `pnpm parity:test` after the fix and land the resulting counter
  movement (the current package percentages are overstated by however many cases
  this credits).

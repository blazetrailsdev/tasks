---
title: "Triage and split the 5,036 newly surfaced non-AR assertion divergences"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6516
claim: "2026-08-14T12:07:07Z"
assignee: "read-association-scope-off-reflection-not-definition-bag"
blocked-by: null
closed-reason: null
---

## Context

PR #6507 widened `ASSERTION_REPORT_PACKAGES`
(`scripts/test-compare/compare.ts:76-88`) from activerecord alone to the full
RFC 0105 closure and seeded
`scripts/test-compare/assertion-mismatch-mark.json` at the measured values.
That surfaced 5,036 previously unmeasured divergences in the non-AR closure:

| package       | count | kind | value |
| ------------- | ----: | ---: | ----: |
| activesupport |  1090 | 1505 |   139 |
| activemodel   |   473 |  707 |    96 |
| arel          |   180 |  591 |    17 |
| globalid      |    53 |   71 |     2 |
| date          |    21 |   31 |     1 |
| i18n          |    18 |   32 |     6 |
| did-you-mean  |     1 |    2 |     0 |

RFC 0105's existing `assertion-parity` cluster is entirely activerecord test
files; nothing in the RFC covers this debt. The other non-AR stories
(`port-i18n-remaining-cases`, `triage-activesupport-in-closure-skip-stubs`,
`port-activemodel-type-temporal-cases`,
`port-date-and-time-compatibility-and-zone-cases`) are name-gap stories and
close a different metric.

Per CONTRIBUTING.md's new "What 100% test compare means" section, these packages
are not at 100% until these counters are zero, so this debt has to be scheduled,
not carried.

This is a triage/split story, not the burndown itself: the per-file breakdown is
`pnpm parity:test -- --assertions --missing --package <pkg>`, and the AR cluster's
~300 LOC-per-story shape is the model to copy.

## Acceptance criteria

- The non-AR assertion debt is broken into PR-sized burndown stories under RFC
  0105, one cluster per package (or per file group where a package's debt is
  concentrated), each with the Rails test file(s) it covers and an est-loc.
- Each filed story converges trails assertions toward the Rails test body — same
  number, same kinds, same literal expected values — never by loosening the
  Rails side or reseeding the mark upward.
- The mark stays only-shrink throughout; no story lowers a counter by widening
  a report scope or deleting a measured package.

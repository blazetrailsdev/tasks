---
title: "test-fixture-parity-drop-empty-fixtures-exemption"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7942
claim: "2026-09-22T00:57:54Z"
assignee: "test-fixture-parity-drop-empty-fixtures-exemption"
blocked-by: null
closed-reason: null
---

## Context

`eslint/test-fixture-parity.mjs:246-252` exempts every test in a describe that calls
`fixtures([])` from the per-test accessor check. An empty fixture call proves nothing about a
test whose Rails counterpart reads fixture rows, and the exemption makes a test's lint result
depend on which describe it sits in: `has-many-associations-test-rails-member-order` (merging
the file into Rails' single fixture union, `has_many_associations_test.rb:118-123`) reds 46
tests purely by moving them out of `fixtures([])` blocks.

With the exemption removed, the whole activerecord test tree reports exactly those 46 tests, all
in `associations/has-many-associations.test.ts`. The baseline
(`eslint/test-fixture-parity-exclude.json`) is whole-file only, so baselining them would
un-gate that file's other ~270 tests.

## Acceptance criteria

- `fixtures([])` no longer satisfies the rule; every mapped active test is judged by its body.
- The exclude baseline accepts per-test entries alongside whole-file entries, and the 46 tests
  are baselined per test (the file stays gated for everything else).
- `pnpm fixture-parity-baseline:refresh` preserves existing whole-file entries that still
  violate and writes all other violations per test.
- Rule tests cover: empty fixtures no longer exempt; per-test baseline entry suppresses only
  its test.

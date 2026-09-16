---
title: "assertions-activesupport-hash-cluster-remainder"
status: claimed
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-09-16T14:32:47Z"
assignee: "size-and-file-assertion-work-for-widened-packages"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-hash-cluster`, whose PR converged
`core_ext/hash/transform_values_test.rb` (0/0/0) and the `deep merge`, `except`,
`except with more than one argument` and `extract nils` rows of
`core_ext/hash_ext_test.rb`, then hit the LOC ceiling.

Still outstanding (measure with
`pnpm parity:test -- --assertions --missing --package activesupport`):

- `vendor/rails/activesupport/test/hash_with_indifferent_access_test.rb` vs
  `packages/activesupport/src/hash-with-indifferent-access.test.ts` (~60 count / 74 kind / 3 value).
- `vendor/rails/activesupport/test/core_ext/hash_ext_test.rb` vs
  `packages/activesupport/src/core-ext/hash-ext.test.ts` (~26 count rows left: `methods` needs
  `assertRespondTo`, the deep transform / symbolize / stringify families, `assert valid keys`,
  `reverse merge`, `deep merge with block` — `deepMerge` takes no block yet, hash_ext.rb deep_merge).
- `vendor/rails/activesupport/test/ordered_hash_test.rb` vs `ordered-hash.test.ts` (19 / 25 / 0).

Techniques: see `packages/activesupport/src/ordered-options.test.ts`; duplicate a call where Rails
asserts both `h[:a]` and `h["a"]`.

## Acceptance criteria

- The three files report 0 assertion-count / kind / value mismatches, or a call-site comment says why.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered for activesupport; never raised.
- No test name changes.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.

---
title: "test:compare — compare literal assertion expected-values (phase 3)"
status: claimed
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-07-02T02:38:21Z"
assignee: "assertion-expected-value-comparison"
blocked-by: null
closed-reason: null
---

## Context

Follow-on phase from `assertion-expectation-kind-comparison` (PR #4393), which
compares assertion _kinds_ (equality vs truthiness) via a normalized histogram
but explicitly does NOT compare the literal expected values. Both
`assert_equal 5, foo` / `expect(foo).toEqual(5)` and `assert_equal 3, foo` /
`expect(foo).toEqual(4)` normalize to `{equal: 1}` and read as matching, even
though the second pair asserts different constants — a fidelity gap a kind
histogram can't catch.

The plumbing is in place: `scripts/test-compare/assertion-kinds.ts` normalizes
kinds and `extractTestsFromSource` / the Ruby extractor already emit
`assertionKinds` per test. This story extends the extractors to also capture the
literal expected-value argument of each mapped assertion (e.g. the first arg of
`assert_equal`, the matcher arg of `toEqual(...)`) where it is a literal
(number/string/bool/nil), and compares them for matched pairs.

Relevant files: `scripts/test-compare/extract-ts-core.ts` (`expectChainMatcher`
/ `collectAssertionKinds`), `scripts/test-compare/extract-ruby-tests.rb`
(`collect_assertion_kinds_expanded`), `scripts/test-compare/assertion-kinds.ts`,
`scripts/test-compare/test-compare.ts` (`recordKind` / `assertionKindMismatch` /
ASSERTION KIND MISMATCHES report section).

## Acceptance criteria

- For matched, implemented pairs where BOTH sides use a value-bearing mapped
  kind (equal/nil/includes/…), extract the literal expected value on each side
  and compare; surface value divergences in the existing `--assertions` report
  (informational, no gate), reusing ASSERTION_REPORT_PACKAGES scope + JSON.
- Only compare when both sides are literals (number/string/bool/nil); skip when
  either expected value is a computed expression/variable (can't statically
  compare). Document the skip rule.
- Handle obvious literal normalization (e.g. Ruby `nil` ↔ TS `null`, symbol vs
  string where applicable); document what is NOT normalized.
- Extractor + report unit tests for value capture and the value-diff.
- Keep count/kind lockstep untouched; this is additive.

Hard rules: NO `node:*` imports, NO `process.*`, async fs only, no new runtime
deps, 500 LOC ceiling, single PR from main, test names match Rails verbatim,
camelCase only.

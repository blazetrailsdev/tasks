---
title: "duplicate-to-sentence-test-group-in-collections"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: test-file dedup hygiene. The Rails-mapped port in core-ext/array/conversions.test.ts is already correct (fixed by #6039); the leftover weaker group in collections.test.ts:596 changes no ported behavior."
---

## Context

`packages/activesupport/src/collections.test.ts:600-660` contains a second,
partial port of `activesupport/test/core_ext/array/conversions_test.rb`'s
`ToSentenceTest` — the same test names (`with blank elements`,
`with invalid options`, `always returns string`, `returns no frozen string`)
already ported in `packages/activesupport/src/core-ext/array/conversions.test.ts`,
which is the file that maps to conversions_test.rb.

The duplicate drifts: its `with invalid options` asserted
`expect(...).not.toThrow()` with the comment "Invalid options are ignored in
our implementation", where conversions_test.rb:58-63 asserts an `ArgumentError`.
PR #6039 fixed the copy in `conversions.test.ts` and left the duplicate, since
its weaker assertion still passes.

## Acceptance criteria

- The `ToSentenceTest` cases in `collections.test.ts` are deleted; the ported
  group in `core-ext/array/conversions.test.ts` is the only one.
- Any case present only in the duplicate is moved to `conversions.test.ts`
  first, matching its conversions_test.rb body. Test names unchanged.

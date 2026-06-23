---
title: "rangeIncludesStringValue: faithful String#succ reachability for mixed character classes"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 40
pr: 3948
claim: "2026-06-23T01:31:16Z"
assignee: "string-range-succ-reachability-fidelity"
blocked-by: null
---

## Context

`rangeIncludesStringValue` (`packages/activesupport/src/range-ext.ts`), added
in PR #3522 to support String ranges in the inclusion validator
(`packages/activemodel/src/validations/clusivity.ts`), models Ruby's
`String#succ`-enumerated `Range#include?` membership as `(length, then
lexicographic)` ordering. This is EXACT for single-succ-class strings (pure
`a-z`, the inputs Rails string ranges are used with) but an approximation for
mixed character classes.

Known divergence (pinned by a test in
`packages/activesupport/src/core-ext/range-ext.test.ts`,
"string include approximates succ for mixed character classes"):
Ruby's `String#succ` only increments alphanumerics and carries within a
character class, so `("a".."bbb").include?("a1")` is `false` (succ never
produces `"a1"`), but `rangeIncludesStringValue` returns `true` because `"a1"`
falls inside the `(length, lex)` window.

Rails reference: `activemodel/lib/active_model/validations/clusivity.rb:40-51`
delegates string ranges to `Range#include?`, which enumerates via
`String#succ` (range.c `rb_str_include_range_p` / `str_upto_each`).

## Acceptance criteria

- [ ] `rangeIncludesStringValue` returns `false` for values unreachable by
      `String#succ` from `begin` (mixed character classes / punctuation),
      matching Ruby `Range#include?` exactly.
- [ ] Implement faithful `String#succ` per-class carry logic (or bounded
      enumeration) replacing the `(length, lex)` approximation.
- [ ] Convert the pinned known-gap test (`"a1"` case) to assert the corrected
      `false` result.

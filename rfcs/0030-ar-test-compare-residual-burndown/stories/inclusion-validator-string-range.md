---
title: "inclusion-validator-string-range"
status: claimed
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: "2026-06-17T02:16:24Z"
assignee: "inclusion-validator-string-range"
blocked-by: null
---

## Context

Surfaced in PR #3414 review (autosave-has-many-save-on-parent). That PR added
numeric/date `Range` (`cover?`) support to the inclusion validator
(`packages/activemodel/src/validations/clusivity.ts`). `isRange` is a structural
duck-check (`begin`/`end`/`excludeEnd`), so a `makeRange<string>("a","z")`
passes `checkValidityBang` but:

- `inclusionMethod` returns `include?` (endpoint is a string, not number/Date), and
- `isMemberOf` on the Range object returns `false` (RangeExt comparators in
  `packages/activesupport/src/range-ext.ts` only handle `number | Date`).

Result: a string range silently always-fails validation, whereas Rails'
`Range#include?` supports string ranges (lexicographic). Rails coverage:
`vendor/rails/activemodel/test/cases/validations/inclusion_validation_test.rb`
`test_validates_inclusion_of_range` (`in: "aaa".."bbb"`), currently stubbed in
trails as `validates inclusion of range` using an integer array
(`inclusion-validation.test.ts`, comment: "TS doesn't have Ruby ranges").

## Acceptance criteria

- [ ] `RangeExt` comparators (`rangeIncludesValue`) handle string endpoints
      (lexicographic `<=`/`<`), or `clusivity` routes string ranges to a
      string-aware cover check.
- [ ] `inclusionMethod` returns `cover?` for string-endpoint ranges (mirrors
      clusivity.rb:39-50 — any Range gets cover?/include? by endpoint type;
      Rails uses `include?` for non-Numeric/Time/Date, which for a Range still
      delegates to `Range#cover?`-equivalent membership).
- [ ] Un-stub `validates inclusion of range` to use a real string
      `makeRange("aaa","bbb")`, mirroring Rails `test_validates_inclusion_of_range`
      (bbc/aa/aaab invalid; aaa/abc/bbb valid).

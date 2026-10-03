---
title: "parity: the structural-duplicates report erases an element access's index, and 12 non-activerecord candidates are untriaged"
status: done
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8452
claim: "2026-10-03T17:49:17Z"
assignee: "object-literal-module-members-carry-arm-skeletons"
blocked-by: null
closed-reason: null
---

## Context

After trails#8438, `pnpm parity:structural-duplicates:report`
(`scripts/api-compare/report-structural-duplicates.ts`) lists 17 candidates across 6 ruby-compat exports,
none in activerecord. 9 of them match `first` (`packages/ruby-compat/src/array.ts`, `ary[0]`), and at least
five are false positives of one class: **the index of an element access is erased.**

`extractShapeTokens` (`scripts/api-compare/extract-ts-api.ts`) records an `ElementAccessExpression` as a bare
`[]`, and an index read is not a call site, so its argument never reaches `callArgs` either. `ary[0]` and
`ary[1]` therefore share a shape:

- `activesupport/core-ext/array/access.ts:32 second`, `:36 third`, `:40 fourth`, `:44 fifth`, `:48 fortyTwo`
  (Rails `vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/array/access.rb`, `self[1]` …
  `self[41]`) all match `first`.

The other four `first` rows (`activesupport/core-ext/hash/conversions.ts:115 isBecomeArray`,
`actiondispatch/http/permissions-policy.ts:44 policyPresent`, `actiondispatch/middleware/debug-view.ts:17
constructor`, `rack/conditional-get.ts:48 isEtagMatches`) and the remaining 8 rows (`strlen` x2, `valuesAt`
x2, `[Symbol.iterator]` x2, `rtest` x1, `regexpEscape` x1) have not been triaged: each is either a real
copy of a ruby-compat primitive to converge onto the primitive, or another erased-token class.

`shapeTokens` is read only by the report, so changing its tokens moves no call gate.

## Acceptance criteria

- [ ] An element access records its literal index in `shapeTokens` (e.g. `[num:1]`, `[str:k]`, bare `[]`
      for a non-literal), with a test in `extract-ts-api.test.ts` and one in
      `report-structural-duplicates.test.ts` that fails on the current shape.
- [ ] `second` … `fortyTwo` no longer match `first`.
- [ ] Each remaining candidate is triaged: a real duplicate is converged onto the ruby-compat primitive or
      filed as its own story with the Rails `file:line`; a false positive is separated by the shape.
- [ ] `regexpEscape`'s match is still reported until it is converged, and `pnpm parity:api:calls:args` is
      unchanged.

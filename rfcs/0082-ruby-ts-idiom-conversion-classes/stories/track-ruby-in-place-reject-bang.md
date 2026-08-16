---
title: "Ruby in-place reject! has no single trails spelling (extract!, Duration#initialize)"
status: draft
updated: 2026-08-16
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `reject!` mutates the receiver in place and is used in two ported bodies
that do not reproduce it:

- `vendor/rails/activesupport/lib/active_support/core_ext/array/extract.rb:15` —
  `extract!` calls `reject!` on `self`, so the receiver loses the extracted
  elements. trails' `extractBang` (`packages/activesupport/src/array-utils.ts`)
  removes them with its own splice loop rather than a shared `rejectBang`.
- `vendor/rails/activesupport/lib/active_support/duration.rb:228` —
  `@parts.reject! { |k, v| v.zero? } unless value == 0`. trails' `Duration`
  constructor (`packages/activesupport/src/duration.ts`) omits the zero-valued
  parts while building the parts object, so nothing is rejected in place.

Both surfaced as call-mismatch baseline rows in PR #6604 — porting
`DescendantsTracker.reject!` made the Ruby name resolvable to the gate, which
then reported these two pre-existing omissions. Neither file was touched by that
PR; the rows are in
`scripts/api-compare/call-mismatches-exclude/activesupport/array-utils.json` and
`.../duration.json`.

This is the JS-has-no-`reject!` idiom class: `Array#reject!` / `Hash#reject!`
have no JS counterpart, so every port open-codes a different in-place removal.

## Converged shape

Decide one spelling for Ruby in-place `reject!` in trails (the existing
`DescendantsTracker.rejectBang` is the precedent — reverse-index splice,
returning the receiver), use it in both bodies at the Rails call site, and delete
the two baseline rows.

## Acceptance criteria

- [ ] `extractBang` and `Duration`'s constructor reject in place at the Rails
      call site, with the same spelling.
- [ ] Both baseline rows deleted (only-shrink); `pnpm parity:api:calls` clean.
- [ ] `array-utils` and `duration` test files pass unchanged.

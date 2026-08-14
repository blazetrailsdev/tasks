---
title: "blank?/present? live in string-utils with three private copies in actionpack"
status: done
updated: 2026-08-14
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6499
claim: "2026-08-13T23:57:08Z"
assignee: "converge-strict-loading-violation-signature"
blocked-by: null
closed-reason: null
---

## Context

PR #6495 taught `isBlank` (`packages/activesupport/src/string-utils.ts:5`) Ruby's
`respond_to?(:empty?)` arm for `Set`/`Map` — before it, every `Set` was blank,
which is why `fixtures.ts` had hand-rolled `.size > 0` instead of calling
`present?`.

That fix exposes the real divergence: Rails' `blank?` / `present?` live in
`activesupport/lib/active_support/core_ext/object/blank.rb` as per-class methods
(`Object#blank?` = `respond_to?(:empty?) ? !!empty? : !self`, plus the
`NilClass`, `FalseClass`, `TrueClass`, `Array`, `Hash`, `Symbol`, `String`,
`Numeric`, `Time` overrides at blank.rb:15-146). trails spells them as one
type-switching free function in `string-utils.ts`, a file with no Rails
counterpart, and at least three callers keep their OWN private copy rather than
importing it:

- `packages/actionpack/src/action-controller/metal/strong-parameters.ts:77`
- `packages/actionpack/src/action-dispatch/http/url.ts:44`
- `packages/actionpack/src/action-dispatch/journey/formatter.ts:315`

Each copy is a different subset of blank.rb, so they disagree on `Set`, on
whitespace strings, and on `0`.

## Converged shape

One `blank.ts` under `core-ext/object/` carrying blank.rb's arms in Rails' order,
which `string-utils.ts` re-exports (or delegates to) and the three private copies
import, so there is a single answer to `blank?` per value class.

## Acceptance criteria

- [ ] `blank?`/`present?` live at the Rails path with the blank.rb per-class arms.
- [ ] The three private `isBlank` copies in actionpack are deleted in favour of it.
- [ ] Existing `blank.test.ts` stays green; no behavior change for strings.

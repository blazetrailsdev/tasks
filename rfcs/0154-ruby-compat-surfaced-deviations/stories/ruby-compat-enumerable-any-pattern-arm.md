---
title: "Enumerable#any? has no pattern-argument (===) arm"
status: draft
updated: 2026-09-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7989 ported Ruby core `Enumerable` into ruby-compat
(`packages/ruby-compat/src/enumerable.ts`) with `map`, `first` and `any?` → `isAny`.
Ruby's `enum_any` (`vendor/ruby/enum.c:1861`, via `ENUMFUNC(any)` / `DEFINE_ENUMFUNCS(any)`
`:1807-1814`) has three arms: no block tests the element (`RTEST(i)`), a block
tests its result, and a **pattern argument** tests `pattern === element`
(`[nil, false, 0].any?(Numeric)`, `%w[bar baz].any?(/m/)`). `isAny` takes only the
optional block. The pattern arm was left out because ruby-compat has no general
`===` (case-equality) dispatch; `Range#caseEquals` and the String method table's
`caseEquals` are the only per-class spellings.

## Acceptance criteria

- ruby-compat gains an `rbCaseEq(pattern, obj)` send (Ruby `Object#===` defaults to `==`,
  `Module#===` is `is_a?`, `Regexp#===` matches a String, `Range#===` is `cover?`),
  dispatching to a receiver's own `caseEquals` when it has one.
- `Enumerable.isAny(pattern?, block?)` takes the pattern arm through it, matching
  `enum.c`'s `ENUMFUNC` selection. Ruby warns and ignores the block when both are
  given (`WARN_UNUSED_BLOCK`).
- Trails tests cover all three arms, including `[nil, false, 0].any?(Numeric)`.

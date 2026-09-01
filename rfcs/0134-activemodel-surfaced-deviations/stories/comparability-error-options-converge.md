---
title: "activemodel: converge Comparability#errorOptions onto except/merge and retire its two placeholder baseline rows"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `error_options`
(`vendor/rails/activemodel/lib/active_model/validations/comparability.rb:10-15`)
is `options.except(*COMPARE_CHECKS.keys).merge!(count: option_value, value: value)`.

trails (`packages/activemodel/src/validations/comparability.ts:10-25`) spells
it as a hand-rolled filter loop. Two baseline rows in
`scripts/api-compare/call-mismatches-exclude/activemodel/validations/comparability.json`
(`except`, `merge!`) carry only the RFC 0126 "pre-existing divergence newly
VISIBLE … pending per-body convergence review" placeholder — unpaid debt, not
a language shortcoming: ruby-compat/activesupport already export hash helpers
(check `@blazetrails/ruby-compat` for `except`; `transformValues` lives there
already).

## Acceptance criteria

- The body calls `except` and a merge helper matching Rails' call set;
  hand-rolled loop gone.
- Both baseline rows DELETED (only-shrink; then
  `pnpm parity:api:calls:tighten activemodel/validations/comparability.json`).
- `validations/comparison` tests stay green.

## Notes

Sibling story in this RFC (carried from 0023):
`comparison-validator-private-compare-is-invented` converges the OTHER half of
the comparability/comparison pair — the invented private `compare()` dispatch
table and the `@noRailsEquivalent PERMANENT` on `compareOperator` that stands
in for Ruby's `public_send`. The two touch the same two files
(`validations/comparability.ts`, `validations/comparison.ts`); sequence them
rather than running both at once, and prefer landing that one first since it
may delete the code this one edits.

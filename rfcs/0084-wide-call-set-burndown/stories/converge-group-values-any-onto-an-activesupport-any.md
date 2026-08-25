---
title: "Spell group_values.any? with an activesupport any() in calculations"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6438
claim: "2026-08-12T21:36:51Z"
assignee: "hoist-nokogirisax-hash-builder-to-module-scope"
blocked-by: null
closed-reason: null
---

## Context

PR #6434 ported Rails' `calculate` (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:217-246`)
into `packages/activerecord/src/relation/calculations.ts`. Rails tests
`group_values.any?` three times in that body — calculations.rb:222 and :228 (the
`@none` arm picks `Hash.new` vs `0`/`nil`) and calculations.rb:240 (the
`order_values = []` clear). `perform_calculation` (calculations.rb:447/453) tests
it twice more.

trails spells all of them `groupValues.length > 0` /
`_groupColumns.length === 0`, because `@blazetrails/activesupport` exports the
`many` free function (`packages/activesupport/src/enumerable-utils.ts:91`) for
`many?` but has no `any` counterpart. That costs two call-set baseline rows:
`calculate any?` and `perform_calculation any?` in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`.

## Converged shape

Add `any` to `packages/activesupport/src/enumerable-utils.ts` next to `many`,
mirroring Ruby's `Enumerable#any?` (a bare call is "not empty"; a block/predicate
form is "some element matches"), export it, and call it at every `any?` site in
`relation/calculations.ts`. Then delete the two `any?` rows from the exclude
baseline by hand (only-shrink: no `--write`/reseed).

## Acceptance criteria

- [ ] `any` exists in activesupport with the block and bare arms, unit-tested
      against Ruby's semantics (`[].any?`, `[nil].any?`, `[nil].any? { }`).
- [ ] Every `group_values.any?` site in `relation/calculations.ts` calls it.
- [ ] The `calculate any?` and `perform_calculation any?` rows are gone from the
      exclude baseline and `pnpm parity:api:calls` is green.

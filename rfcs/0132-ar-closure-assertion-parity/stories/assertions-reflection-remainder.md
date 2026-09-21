---
title: "assertions-reflection-remainder"
status: in-progress
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7933
claim: "2026-09-21T15:56:29Z"
assignee: "assertions-reflection-remainder"
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-reflection-primary-keys-multiparameter-remainder`
(RFC 0132). That story covered three files; `multiparameter_attributes_test.rb`
and `primary_keys_test.rb` are converged to 0 count/kind/value mismatches and
`reflection_test.rb` did not fit under the PR LOC ceiling.

Measure with `pnpm parity:test -- --package activerecord --assertions --missing`
and grep `reflection_test.rb`. As of that PR the file carries **27
assertion-count mismatches and 46 assertion-kind mismatches** — every remaining
row in the three-file set. Rails is
`vendor/rails/activerecord/test/cases/reflection_test.rb`, trails is
`packages/activerecord/src/reflection.test.ts`.

The recurring shapes, from the measured kind rows:

- `assert_predicate` / `assert_not_predicate` ported as `toBe(true)` /
  `toBe(false)` where the canonical kind is `truthy` / `falsy` — e.g.
  `nested?`, `collection association`, `default association validation`,
  `always validate association if explicit`, `validate association if autosave`,
  `never validate association if explicit`, `column null not null`.
- `assert_nothing_raised` dropped for a `notNil` — `reflection klass for nested
class name`, `includes accepts symbols`/`strings`, `reflect on association
accepts symbols`/`strings`, `reflect on missing source assocation`,
  `find`-shaped rows.
- `assert_match` on an exception message replaced by `notNil` on the error —
  `reflection klass not found with no class name option`,
  `… with pointer to non existent class name`, `reflection klass requires ar
subclass`.
- `assert_reflection` (`reflection_test.rb:31-40`) is unmapped on the Rails
  side, so `association reflection in modules` needs a trails `assert*` helper
  of the same name rather than 19 inline `expect`s — see
  [[trails-assert-helper-is-one-unmapped-assertion]].
- Plain count gaps where the port asserts a subset — `column string type and
limit` (7 vs 4), `non existent types are identity types` (6 vs 3),
  `association primary key` (6 vs 2), `aggregation reflection` (6 vs 3).

## Acceptance criteria

- `reflection_test.rb` reports 0 assertion count/kind/value mismatches.
- Failures caused by production bugs are parked `it.skip` with a `BLOCKED:`
  comment naming a story filed in RFC 0155.

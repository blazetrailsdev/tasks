---
title: "assertions-activemodel-validations-remainder"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7932
claim: "2026-09-21T15:47:11Z"
assignee: "assertions-activemodel-validations-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activemodel-validations-and-secure-password`, which
converged `secure_password_test.rb` (64 → 0) and hit the PR's 700-LOC ceiling.
Re-measured on that branch with
`pnpm parity:test -- --package activemodel --assertions --missing`:

| Rails file                                    | count | kind | value |   total |
| --------------------------------------------- | ----: | ---: | ----: | ------: |
| `validations/i18n_validation_test.rb`         |    29 |   31 |     0 |      60 |
| `validations/inclusion_validation_test.rb`    |    10 |   15 |     0 |      25 |
| `validations/with_validation_test.rb`         |     7 |   14 |     0 |      21 |
| `validations/exclusion_validation_test.rb`    |     7 |   11 |     0 |      18 |
| `validations/acceptance_validation_test.rb`   |     6 |   10 |     0 |      16 |
| `validations/format_validation_test.rb`       |     6 |   10 |     0 |      16 |
| `validations/callbacks_test.rb`               |     5 |    9 |     0 |      14 |
| `validations/confirmation_validation_test.rb` |     4 |    7 |     2 |      13 |
| **total**                                     |    74 |  107 |     2 | **183** |

`secure_password_test.rb` is done and is NOT part of this story.

What the measurement shows, so it does not have to be re-derived:

- The dominant shape is `assert_predicate t, :valid?` / `:invalid?`, which
  normalizes to `truthy` (`scripts/test-compare/assertion-kinds.ts:101`), ported
  as `expect(await t.isValid()).toBe(false)` — an `equal`. The fix is
  `expect(await t.isValid()).toBeTruthy()` / `expect(await t.isInvalid()).toBeTruthy()`.
- Most of these files build a bespoke per-test `class Person extends Model`
  where Rails uses `Topic` / `Person`
  (`vendor/rails/activemodel/test/models/topic.rb`, `person.rb`; ours:
  `packages/activemodel/src/test-helpers/models/`), and call
  `this.validates(attr, { confirmation: true })` where Rails calls
  `Topic.validates_confirmation_of(:title)`. Converging the assertion counts
  means porting the Rails bodies, which removes those inline classes.
- `acceptance_validation_test.rb`'s `lazy attribute module included only once` /
  `lazy attributes module included again if needed` use Rails'
  `assert_difference`, which is unmapped on the Rails side — check
  `assert_difference` in `@blazetrails/activesupport`'s testing helpers before
  hand-rolling one.
- `confirmation_validation_test.rb`'s two `value` mismatches are
  `does not override confirmation reader/writer if present`
  (`confirmation_validation_test.rb:87-117`): Rails asserts the literal
  `"expected title"`, the port asserts `true`.

## Acceptance criteria

- [ ] Every Rails file above reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activemodel --assertions`, or the residue is
      carried by a further filed remainder story and the parked rows by filed
      `0155-assertion-surfaced-port-bugs` stories.
- [ ] No test renamed; `parity:test`'s name-gate percent for `activemodel` does
      not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.

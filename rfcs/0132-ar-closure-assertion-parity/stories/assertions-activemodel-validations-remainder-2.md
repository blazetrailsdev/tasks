---
title: "assertions-activemodel-validations-remainder-2"
status: in-progress
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7935
claim: "2026-09-21T17:54:07Z"
assignee: "assertions-activesupport-cache-xml-json-callbacks"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activemodel-validations-remainder`, which converged
`confirmation_validation_test.rb` and `callbacks_test.rb` to 0/0/0 and stopped at
the 700-LOC ceiling. Still open in
`pnpm parity:test -- --package activemodel --assertions --missing`:

- `validations/i18n_validation_test.rb` (60)
- `validations/inclusion_validation_test.rb` (25)
- `validations/with_validation_test.rb` (21)
- `validations/exclusion_validation_test.rb` (18)
- `validations/acceptance_validation_test.rb` (16)
- `validations/format_validation_test.rb` (16)

Pattern already worked out (and proven locally to reach 0/0/0 for
exclusion, acceptance and format): replace each bespoke inline `class Person extends Model`
with `Topic` / `Person` from `packages/activemodel/src/test-helpers/models/`,
call `Topic.validatesXOf(...)` as Rails does, add
`afterEach(() => Topic.clearValidatorsBang())`, and port `assert_predicate t, :valid?`
as `assertPredicate(await t.isValid(), (valid) => valid)`. See
`confirmation-validation.test.ts` for the shape.

Per-file notes:

- **acceptance**: Rails' `define_test_class(Topic)` is `class TestClass extends Topic {}`;
  `assert_difference -> { klass.ancestors.count }, 2` ports as
  `assertDifference(() => includedModules(klass).length, 2, null, block)`
  (`includedModules` from `@blazetrails/ruby-compat`); `respond_to?` as `rbObjRespondTo`.
- **format**: Ruby `\A` / `\z` have no direct JS spelling that passes trails'
  `regexpUsingMultilineAnchors` (`validations/format.ts:83`, which flags any leading `^`
  even without the `m` flag); spell them `(?<![\s\S])` / `(?![\s\S])`. Ruby's
  `/^Valid Title$/` is `/^Valid Title$/m`. `assert_raise(ArgumentError) { ... }` is
  `await assertRaise([ArgumentError], {}, () => ...)`.
- **exclusion** `validates exclusion of with time range`
  (`exclusion_validation_test.rb:108-115`) FAILS when ported faithfully with
  `new Range(days(6).ago(), days(2).ago())`: `packages/ruby-compat/src/comparable.ts`
  `cmp`'s `Time` arm (`:88-92`) reads `a.epochNanoseconds`, but `@blazetrails/date`'s
  `Time` keeps its instant private and spells `<=>` as `compare`
  (`packages/date/src/time.ts:1362`), so every pair of Times compares `0` and
  `Range#cover` is always true. Three-line fix, verified locally: in that arm, call
  `a.compare(b) ?? null` when `compare` is a function, before the epochNanoseconds read.
  Ship it with the exclusion port (it is the regression test).

## Acceptance criteria

- [ ] Each Rails file above reports 0 assertion-count / kind / value mismatches, or the
      residue is carried by a further filed story.
- [ ] `cmp` orders `@blazetrails/date` `Time` values; the exclusion time-range test passes.
- [ ] No test renamed; activemodel name-gate percent does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.

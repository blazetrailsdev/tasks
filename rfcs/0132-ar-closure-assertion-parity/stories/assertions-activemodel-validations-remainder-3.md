---
title: "assertions-activemodel-validations-remainder-3"
status: draft
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activemodel-validations-remainder-2`. That PR converged
`validations/exclusion_validation_test.rb` to 0/0/0 (canonical `Topic`/`Person`,
`Topic.validatesExclusionOf`, `afterEach(() => Topic.clearValidatorsBang())`) and
shipped the `cmp` Time fix (`packages/ruby-compat/src/comparable.ts`, the `Time`
arm now calls `a.compare(b)`), so `new Range(Duration.days(6).ago(), Duration.days(2).ago())`
covers correctly.

Still open in `pnpm parity:test -- --package activemodel --assertions --missing`:

- `validations/i18n_validation_test.rb` (60)
- `validations/inclusion_validation_test.rb` (25)
- `validations/with_validation_test.rb` (21)
- `validations/acceptance_validation_test.rb` (16)
- `validations/format_validation_test.rb` (16)

Pattern: see `packages/activemodel/src/validations/exclusion-validation.test.ts`.
A Ruby `:symbol` `in:` is `":name"` (resolved by `validations/resolve-value.ts`);
`def p.foo` is `Object.assign(p, { foo: ... })`; `assert_equal` on errors is
`expect(t.errors.get("x")).toEqual([...])`.

- **acceptance**: `define_test_class(Topic)` is `class TestClass extends Topic {}`;
  `assert_difference -> { klass.ancestors.count }, 2` ports as
  `assertDifference(() => includedModules(klass).length, 2, null, block)`;
  `respond_to?` as `rbObjRespondTo`.
- **format**: Ruby `\A` / `\z` spell `(?<![\s\S])` / `(?![\s\S])` (trails'
  `regexpUsingMultilineAnchors`, `validations/format.ts:83`); `/^Valid Title$/` is
  `/^Valid Title$/m`; `assert_raise(ArgumentError)` is `assertRaise([ArgumentError], {}, ...)`.

## Acceptance criteria

- [ ] Each Rails file above reports 0 assertion-count / kind / value mismatches.
- [ ] No test renamed; activemodel name-gate percent does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.

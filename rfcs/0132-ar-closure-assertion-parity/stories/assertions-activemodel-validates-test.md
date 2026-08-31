---
title: "activemodel validates_test assertion parity"
status: ready
updated: 2026-08-17
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: []
deps:
  - converge-model-validates-onto-rails-generic-lookup
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Re-filed out of `assertions-activemodel-length-numericality-comparison-refile`
(PR #6625 investigation), one story per file.

Rails: `vendor/rails/activemodel/test/cases/validations/validates_test.rb`
(169 lines). trails: `packages/activemodel/src/validations/validates.test.ts`
(291 lines).

Measured: **14 assertion-count + 21 assertion-kind + 0 assertion-value**
mismatches, over 21 matched tests (0 trails-only extras).

## Blocked on `Model.validates` first

This is the smallest file of the five but the only one that cannot be closed by
a test port alone. `Model.validates` (`packages/activemodel/src/model.ts:561`)
is a hardcoded `if (rules.presence) … if (rules.length) …` chain, where Rails'
`validates` (activemodel/lib/active_model/validations/validates.rb:105-124) is
generic. Three capabilities the Rails test exercises are simply absent:

- **Validator lookup by option key** — Rails resolves
  `key.to_s.camelize + "Validator"` through `const_get`, which is how
  `Person.validates :karma, email: true` reaches `EmailValidator` and
  `'namespace/email': true` reaches `Namespace::EmailValidator`. Eight tests
  depend on it (`with_validator_class`, `with_namespaced_validator_class`, the
  four `if`/`unless` local/shared-condition tests, `with_allow_nil_shared_conditions`,
  `with_validator_class_and_options`), plus the three `PersonWithValidator`
  tests for a validator mixed in on the model.
- **`ArgumentError` on an unknown key** — validates.rb raises
  `"Unknown validator: 'UnknownValidator'"` for both `unknown: true` and
  `unknown: false`; trails silently ignores the key, so
  `test_validates_with_unknown_validator` and
  `test_validates_with_disabled_unknown_validator` have nothing to assert.
- **`_validates_default_keys`** — `test_defining_extra_default_keys_for_validates`
  turns on Topic's `_validates_default_keys` override (test/models/topic.rb:11-13)
  so a top-level `message:` reaches the confirmation validator.

Rails' `_parse_validates_options` (validates.rb:158-169) is also what makes the
shorthands in this file work — `format: /positive|negative/`,
`inclusion: %w(m f)`, `length: 6..20`.

**Order of work:** converge `Model.validates` onto validates.rb first (its own
story under the best-fit RFC), then port this test file. Porting the file
against today's `validates` would mean inventing 15 of its 21 tests all over
again.

## Why this is a re-port, not an assertion edit

Measured 2026-08-16 with `pnpm parity:test -- --assertions --package activemodel`
after a full `pnpm build`. The trails file matches Rails only by `it(...)` name:
every body declares its own ad-hoc inline model and asserts an invented
scenario, so there is no assertion to "adjust" onto the Rails one. Converging
means porting the Rails test file — its models, its per-test bodies, its
assertion kinds in order — over the top of the existing file.

Follow the shape already proven green in
`packages/activemodel/src/validations/absence-validation.test.ts`: models
declared once at file scope with a `Mirrors: activemodel/test/models/*.rb`
comment, `afterEach` calling `clearValidatorsBang()`, and `assertPredicate` from
`@blazetrails/activesupport` wherever Rails writes `assert_predicate` (a bare
`expect(...).toBe(true)` normalizes to `equal`, not `predicate`, and is what
produces most of the kind deltas below).

Where the Rails file delegates to a private helper whose name starts with
`assert_` (`assert_valid_values` / `assert_invalid_values`), port the helper
under the camelCased name and call it at the same sites: both extractors treat
an `assert*` callee as ONE assertion with its own name as the kind, and both
sides then normalize to _unmapped_, so the counts line up and no kind delta is
produced. Inlining the helper is what turns 2 Rails assertions into N trails
`equal`s today.

## Acceptance criteria

- The file reports 0 assertion-count, 0 assertion-kind and 0 assertion-value
  mismatches in `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  file's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope).
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- Any trails-only extra test worth keeping moves to the sibling
  `*.trails.test.ts`, per CLAUDE.md.

---
title: "generated-attribute-tests-onto-create-generated-attribute"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

`finish-moving-generator-tests-onto-testing-assertions` (trails#8265) ported
`Behavior#create_generated_attribute` (`vendor/rails/v8.0.2/railties/lib/rails/generators/testing/behavior.rb:89-92`)
to `packages/trailties/src/generators/testing/behavior.ts` and moved the
field-type / default-value tests in
`packages/trailties/src/generators/generated-attribute.test.ts` onto
`assertFieldType` / `assertFieldDefaultValue`. The PR's 700-LOC ceiling left
these `generated_attribute_test.rb` bodies hand-rolled:

- `test_field_name_with_dangerous_attribute_raises_error` (`generated_attribute_test.rb:20-26`):
  Rails does `assert_raise(Rails::Generators::Error) { create_generated_attribute :string, :save }`
  then `assert_match message, e.message`. trails calls `GeneratedAttribute.parse("save:string")`
  with `expect(...).toThrow`.
- `test_field_type_with_unknown_type_raises_error` (`:70-77`): Rails does
  `create_generated_attribute :unknown` and asserts the message
  "Could not generate field 'test' with unknown type 'unknown'". trails parses
  `title:bogus` / `title:string:bogus` and checks only the class.
- `test_field_type_with_unknown_index_type_raises_error` (`:79-86`) is not
  ported. Rails does `create_generated_attribute "string", "name", :unknown`
  and asserts "Could not generate field 'name' with unknown index 'unknown'".
- `test_default_value_is_datetime` (`:100-104`): Rails does
  `assert_field_default_value attribute_type, Time.now.to_fs(:db)`. trails
  checks the value against a format regex. The Rails shape needs a local
  `Time.now`, i.e. `@blazetrails/date`'s `Time.now()` and activesupport's
  time `toFs(..., "db")`, and trailties does not depend on `@blazetrails/date`
  yet. activesupport's `toFs(new Date(), "db")` renders UTC, where
  `GeneratedAttribute#default` renders local time.

Use `assertRaise` / `assertMatch` from `@blazetrails/activesupport` and
`createGeneratedAttribute` from `./testing/behavior.js`.

## Acceptance criteria

- The four tests above mirror their `generated_attribute_test.rb` bodies
  through `createGeneratedAttribute` / `assertFieldDefaultValue`, and the
  Rails messages are asserted.
- `test_field_type_with_unknown_index_type_raises_error` is ported under its
  Rails name.
- The trailties row of `scripts/test-compare/assertion-mismatch-mark.json` is
  written down if it falls.

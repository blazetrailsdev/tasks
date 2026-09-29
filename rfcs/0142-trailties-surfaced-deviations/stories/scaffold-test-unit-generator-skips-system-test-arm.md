---
title: "scaffold-test-unit-generator-skips-system-test-arm"
status: draft
updated: 2026-09-29
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

`TestUnit::Generators::ScaffoldGenerator#create_test_files`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/scaffold/scaffold_generator.rb:20-29`)
has a second arm: `if !options.api? && options[:system_tests]` it templates
`system_test.rb` into `test/system/<class_path>/<plural file_name>_test.rb`
(`test_unit/scaffold/templates/system_test.rb.tt`). That template reads the
private `boolean?`, `datetime?` and `time?` helpers (`scaffold_generator.rb:62-75`),
and it is gated by `class_option :system_tests` (`:14-15`).

trails#8253 ported the functional-test arm into
`packages/trailties/src/generators/test-unit/scaffold/scaffold-generator.ts`
(`createTestFiles`, `fixtureName`, `attributesString`, `attributesHash`, `isVirtual`),
but not the system-test arm, the three helpers, or the `system_tests` class option.
Rails' `test_model_name_option` (`scaffold_controller_generator_test.rb:271`)
also asserts `test/system/users_test.rb`.

## Acceptance criteria

- `createTestFiles` ports the `system_tests` arm and emits `system_test.rb.tt`
  test for test (same names), driven through `ActionDispatch::SystemTestCase`.
- `isBoolean`, `isDatetime` and `isTime` are ported with Rails' bodies.
- `model name option` asserts the system test file as Rails does.

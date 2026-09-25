---
title: "finish-moving-generator-tests-onto-testing-assertions"
status: draft
updated: 2026-09-25
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

`port-generators-testing-assertions` ported
`Rails::Generators::Testing::Assertions`
(`vendor/rails/railties/lib/rails/generators/testing/assertions.rb`) to
`packages/trailties/src/generators/testing/assertions.ts` — `assertFile` /
`assertDirectory`, `assertNoFile` / `assertNoDirectory`, `assertMigration`,
`assertNoMigration`, `assertInstanceMethod` / `assertMethod` — and moved
`app-generator.test.ts` plus the first half of `MigrationGeneratorTest`
(through "add migration with references adds foreign keys") onto it. The PR's
700-LOC ceiling stopped it there.

Still hand-rolling `fs.readFileSync` + `expect(...).toContain/toMatch` against
Rails tests that use `assert_migration` / `assert_method` / `assert_match`:

- `packages/trailties/src/generators/migration-generator.test.ts`, from
  `it("create join table migration")` to the end of `MigrationGeneratorTest`
  (Rails `migration_generator_test.rb:250-470`). Convert exactly as the first
  half was: `await assertMigration(path, (content) => assertMethod("change",
content, (change) => { assertMatch(...); assertNoMatch(...); }))`, and drop the
  then-unused `readMigration` helper.
- `packages/trailties/src/generators/model-generator.test.ts` — 28 kind
  mismatches against `model_generator_test.rb` (`assert_file`,
  `assert_migration`, `assert_no_migration`, `assert_method`).

Still unported members of `assertions.rb`: `assert_class_method` (`:87-89`),
`assert_field_type` (`:109-111`), `assert_field_default_value` (`:117-123`),
`assert_initializer` (`:141-143`). `assert_field_*` need Behavior's
`create_generated_attribute` (`testing/behavior.rb:89-92`) ported into
`generators/testing/behavior.ts`.

## Acceptance criteria

- The remaining `MigrationGeneratorTest` bodies and `model-generator.test.ts`
  assert through `generators/testing/assertions.ts`, mirroring the Rails test
  bodies.
- `assertClassMethod`, `assertFieldType`, `assertFieldDefaultValue`,
  `assertInitializer` are ported in Rails member order.
- The trailties row of `scripts/test-compare/assertion-mismatch-mark.json`
  (assertionCount 33, kind 57 after the first PR) falls, and is written down.

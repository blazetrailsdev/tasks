---
title: "scaffold-controller-hooks-test-framework-and-engine-arms"
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

`Rails::Generators::ScaffoldControllerGenerator` hooks its test generator with
`hook_for :test_framework, as: :scaffold`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/scaffold_controller_generator.rb:35`).
The framework comes from `test_framework :test_unit`
(`railties/lib/rails/test_unit/railtie.rb:8`).
trails#8253 made `TestUnit::Generators::ScaffoldGenerator`
(`packages/trailties/src/generators/test-unit/scaffold/scaffold-generator.ts`) a Thor
generator. It has `check_class_collision suffix: "ControllerTest"`, both class options
and the `createTestFiles` command. But
`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`
still invokes it by hand, as `if (test) await this.invoke("test_unit:scaffold")`,
behind an invented `test` option rather than the `test_framework` class option.
`Generators.DEFAULT_OPTIONS.rails.testFramework` is `null`, and generator tests
configure no railtie.

The same port also leaves out two engine / namespacing arms that trails has no
infrastructure for yet:

- `fixture_name`'s `mountable_engine?` arm (`test_unit/scaffold/scaffold_generator.rb:32-38`,
  `(namespace_dirs + [table_name]).join("_")`), together with `mountable_engine?` and
  `namespace_dirs` (`named_base.rb:200`)
- `functional_test.rb.tt:5-8` / `api_functional_test.rb.tt:5-8`'s
  `include Engine.routes.url_helpers`, plus `module_namespacing` around both templates

## Acceptance criteria

- `ScaffoldControllerGenerator` declares `hookFor("testFramework", { as: "scaffold" })`
  and drops the `test` option. `--no-test-framework` skips the tests.
- Generator tests run with `test_framework: "test_unit"` configured, as the
  `TestUnitRailtie` does.
- `mountable_engine?` / `namespace_dirs` are ported, and `fixtureName` and both
  templates take their engine arms.

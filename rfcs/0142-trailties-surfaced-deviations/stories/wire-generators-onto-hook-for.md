---
title: "wire-generators-onto-hook-for"
status: draft
updated: 2026-09-28
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

trails#8228 ported `hook_for` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:174-202`)
as `GeneratorBase.hookFor` (`packages/trailties/src/generators/base.ts`), and seeded
`config.app_generators` from `Rails::TestUnitRailtie`
(`railties/lib/rails/test_unit/railtie.rb:7-13` → `packages/trailties/src/test-unit/trailtie.ts`).
No production generator calls `hookFor` yet, so `testFramework`, `integrationTool`,
`systemTests`, `orm`, `templateEngine`, `helper`, `resourceController` and `resourceRoute`
control nothing. Test files, ORM files and templates are still written inline by each
generator's `run`.

These are the Rails `hook_for` sites to converge:

- `rails/controller/controller_generator.rb:24`: `hook_for :template_engine, :test_framework, :helper`
- `rails/model/model_generator.rb`: `hook_for :orm, required: true`
- `rails/resource/resource_generator.rb:11-18`: `hook_for :resource_controller` (block) and `:resource_route`
- `rails/scaffold/scaffold_generator.rb` / `rails/scaffold_controller/scaffold_controller_generator.rb`: `hook_for :scaffold_controller`, `:template_engine`, `:test_framework`, `:helper`, `:jbuilder`
- `rails/integration_test/integration_test_generator.rb:6`: `hook_for :integration_tool, as: :integration`
- `rails/system_test/system_test_generator.rb`: `hook_for :system_tests, as: :system`

Each hook needs its target generator (`test_unit:*`, `active_record:*`, `tse:*`).
`port-test-unit-generators-model-and-plugin` covers the first `test_unit:*` ones, and
`port-integration-test-generator` covers the integration generator. Related existing
stories: `controller-generator-is-not-a-named-base` and
`scaffold-generator-emits-controller-instead-of-hooking-resource-generator`.

## Acceptance criteria

- Each generator above declares its Rails `hook_for` with the Rails options, and the
  inline test, ORM and template writes move to the hooked generators.
- `trails generate controller Foo --test-framework=nope` reports `nope [not found]`, and a
  configured `config.generators.test_framework` changes which generator runs.

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
as `GeneratorBase.hookFor` (`packages/trailties/src/generators/base.ts`). Since then most
Rails `hook_for` sites have been wired:

- `rails:model` `hookFor("orm", { required: true })` (`generators/rails/model/model-generator.ts:48`)
- `active_record:model` `hookFor("testFramework")` (`generators/active-record/model/model-generator.ts:163`)
- `rails:resource` `resource_controller` / `resource_route` (`generators/rails/resource/resource-generator.ts:39,55`)
- `rails:scaffold` `scaffoldController` (`generators/rails/scaffold/scaffold-generator.ts:13`)
- `rails:scaffold_controller` `resourceRoute` (`scaffold-controller-generator.ts:160`)
- `rails:job` `testFramework` (`generators/rails/job/job-generator.ts:26`)

The sites still unwired each have their own story, so this one is only the cross-cutting
behaviour check:

- controller's `hook_for :template_engine, :test_framework, :helper` →
  `controller-generator-hook-targets-are-unported` / `controller-generator-is-not-a-named-base`
- scaffold_controller's `:template_engine, :test_framework, :helper, :jbuilder` →
  `scaffold-controller-hooks-test-framework-and-engine-arms`
- `rails:migration`'s `hook_for :orm, required: true` → `rails-migration-generator-does-not-hook-orm`
- `integration_test`'s `hook_for :integration_tool, as: :integration` → `port-integration-test-generator`
- `system_test`'s `hook_for :system_tests, as: :system`
  (`railties/lib/rails/generators/rails/system_test/system_test_generator.rb`): no
  `generators/rails/system-test/` exists yet; port it here.

## Acceptance criteria

- `rails:system_test` is ported with its `hook_for :system_tests, as: :system`.
- `trails generate controller Foo --test-framework=nope` reports `nope [not found]`, and a
  configured `config.generators.test_framework` changes which generator runs (a generator
  test, landing once the controller hook story does).

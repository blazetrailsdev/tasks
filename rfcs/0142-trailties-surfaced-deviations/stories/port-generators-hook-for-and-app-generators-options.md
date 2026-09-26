---
title: "port-generators-hook-for-and-app-generators-options"
status: draft
updated: 2026-09-26
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

Rails generators delegate to a configurable sibling generator through
`hook_for` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:174-202`),
which registers a class option whose default comes from
`Rails::Generators.options` (`default_value_for_option` / `default_for_option`,
`base.rb`; `DEFAULT_OPTIONS`, `generators.rb:46-61`), records
`hooks[name] = [in_base, as_hook]`, and invokes the hooked generator via
`prepare_for_invocation` (`base.rb:381-392`) →
`Rails::Generators.find_by_namespace(value, base, context)` (`generators.rb`).
The app-level defaults come from `config.app_generators`
(`railtie/configuration.rb:47-51`, `Rails::Configuration::Generators`), e.g.
`TestUnitRailtie` sets `c.integration_tool :test_unit` / `c.system_tests :test_unit`
/ `c.test_framework :test_unit` (`test_unit/railtie.rb:7-13`), applied by
`Rails::Generators.configure!` (`generators.rb:68-76`).

trails has none of this:

- `GeneratorBase` (`packages/trailties/src/generators/base.ts`) has `classOption`
  but no `hookFor`, `hooks`, `prepareForInvocation`, `baseName` / `generatorName`,
  or `defaultValueForOption`.
- `Generators` (`packages/trailties/src/generators.ts`) has no `options()` /
  `DEFAULT_OPTIONS` / `configureBang`, and `findByNamespace(name, base)` lacks the
  `context` parameter.
- `Trailtie::Configuration#appGenerators()`
  (`packages/trailties/src/trailtie/configuration.ts`) returns `undefined`.
- There is no `TestUnitRailtie` counterpart.

This blocks `port-integration-test-generator` (`rails/integration_test/integration_test_generator.rb`
is only `hook_for :integration_tool, as: :integration`) and every other
`hook_for` generator (`system_test`, `controller`'s `:test_framework`, …).

## Acceptance criteria

- `GeneratorBase.hookFor(...names, { as, in })`, `hooks`, and
  `prepareForInvocation` mirror `base.rb:174-202,381-392`; `start` invokes each
  hooked generator after the generator's own run, as Thor's `invoke_from_option` does.
- `Generators.options()` / `DEFAULT_OPTIONS` mirror `generators.rb:46-61,88-90`,
  and `findByNamespace(name, base, context)` mirrors the three-argument form.
- `appGenerators()` returns a `Configuration::Generators` and a test_unit
  railtie counterpart seeds `integrationTool` / `systemTests` / `testFramework`.
- Tests mirror the `hook_for` arms of `railties/test/generators_test.rb`.

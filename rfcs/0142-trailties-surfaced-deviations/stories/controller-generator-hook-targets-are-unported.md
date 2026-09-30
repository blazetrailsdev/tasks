---
title: "controller-generator-hook-targets-are-unported"
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

Rails' `ControllerGenerator` hooks three generators
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/controller/controller_generator.rb:24-26`):

```ruby
hook_for :template_engine, :test_framework, :helper do |generator|
  invoke generator, [ remove_possible_suffix(name), actions ]
end
```

The targets are `Erb::Generators::ControllerGenerator`
(`railties/lib/rails/generators/erb/controller/controller_generator.rb`, trails:
`Tse::Generators::ControllerGenerator`) and `TestUnit::Generators::ControllerGenerator`
(`railties/lib/rails/generators/test_unit/controller/controller_generator.rb`), plus the
existing `Rails::Generators::HelperGenerator`. trails has neither of the first two
(`packages/trailties/src/generators/tse/` holds only `authentication` and `scaffold`;
`generators/test-unit/` only `model` and `scaffold`), and its
`HelperGenerator` (`generators/rails/helper/helper-generator.ts`) is a `GeneratorBase`
taking `run(name, options)` rather than a hookable `NamedBase`.
So trails' `ControllerGenerator#run` writes views, the controller test and the helper
in line (`generators/rails/controller/controller-generator.ts`).

Blocks `controller-generator-is-not-a-named-base` (the #8226 review required the hook
block to invoke the hooked generators rather than write their files in line).

## Acceptance criteria

- `Tse::Generators::ControllerGenerator` and `TestUnit::Generators::ControllerGenerator`
  ported as `NamedBase` generators taking `actions`, each rendering its Rails template
  (`erb/controller/templates/view.html.erb`, `test_unit/controller/templates/functional_test.rb`)
  via Thor `template` (story `thor-actions-template-is-unported`).
- `HelperGenerator` is invokable from a `hook_for :helper` with Rails' arguments.
- Each is registered so `hook_for :template_engine, :test_framework, :helper` resolves it.

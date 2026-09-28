---
title: "generators-configure-bang-api-only-no-color-fallbacks-templates"
status: claimed
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: "2026-09-28T17:56:44Z"
assignee: "generated-ci-and-manifest-run-eslint-not-rubocop"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators.configure!` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:68-78`) was ported as
`Generators.configureBang` (`packages/trailties/src/generators.ts`) with the aliases/options
`deep_merge!`, `hide_namespaces` and `after_generate_callbacks.replace` lines only. Four lines
are unported because their targets do not exist on trails' `Generators` yet, each carrying a
`@missingRailsCall … — CONVERGEABLE generators-configure-bang-api-only-no-color-fallbacks-templates`:

- `api_only! if config.api_only` (`generators.rb:69`, `api_only!` at `:113-122`)
- `no_color! unless config.colorize_logging` (`:70`, Thor's `no_color!`)
- `fallbacks.merge! config.fallbacks` (`:73`), which also needs `fallbacks` (`:101-103`) and
  `invoke_fallbacks_for` (`:299-313`) in `findByNamespace`
- `templates_path.concat config.templates` / `templates_path.uniq!` (`:74-75`, `templates_path` at `:80-82`)

Also unported: the `ENGINE_PATH` arm of `Rails::Command::Actions#load_generators`
(`railties/lib/rails/command/actions.rb:36-40`: `Engine.find(ENGINE_ROOT)`,
`Rails::Generators.namespace = engine.railtie_namespace`, `engine.load_generators`);
`loadGenerators` in `packages/trailties/src/command/actions.ts` ports the application arm only.

## Acceptance criteria

- `Generators` gains `apiOnlyBang`, `noColorBang` (or its Thor-shell equivalent), `fallbacks()`
  and `templatesPath()`, and `configureBang` calls all of them in Rails' order.
- `findByNamespace` ends with `invokeFallbacksFor(name, base) || invokeFallbacksFor(context, name)`.
- `loadGenerators` gains the engine arm.
- The `@missingRailsCall` receipts naming this story are removed.

---
title: "generators-configure-bang-api-only-no-color-fallbacks-templates"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
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

### Progress (trails#8226)

trails#8226 landed `apiOnlyBang`, `fallbacks`, `templatesPath`, `invokeFallbacksFor` and the
three-argument `findByNamespace(name, base, context)`, and `configureBang` calls them in Rails'
order. What remains:

- `no_color!` (`generators.rb:70`, `command/behavior.rb:12-14`). This needs a Thor shell seat
  (`Thor::Base.shell`, `Shell::Basic` / `Shell::Color`) that `GeneratorBase#say` / `#sayStatus`
  actually color through. Today they take a color and ignore it.
- The `ENGINE_PATH` arm of `loadGenerators` (`command/actions.rb:36-40`). This needs an
  `ENGINE_ROOT` seat, the `Generators.namespace` mattr (`generators.rb:27`) and
  `Engine#railtieNamespace`.

## Acceptance criteria

- `Generators` gains `apiOnlyBang`, `noColorBang` (or its Thor-shell equivalent), `fallbacks()`
  and `templatesPath()`, and `configureBang` calls all of them in Rails' order.
- `findByNamespace` ends with `invokeFallbacksFor(name, base) || invokeFallbacksFor(context, name)`.
- `loadGenerators` gains the engine arm.
- The `@missingRailsCall` receipts naming this story are removed.

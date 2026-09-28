---
title: "generators-no-color-and-load-generators-engine-arm"
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

# Generators: no_color! and load_generators' ENGINE_PATH arm

## Context

Split out of `generators-configure-bang-api-only-no-color-fallbacks-templates`, which ported
`api_only!`, `fallbacks` / `invoke_fallbacks_for`, `templates_path` and the three-argument
`find_by_namespace` into `packages/trailties/src/generators.ts`. Two pieces remain:

- `no_color! unless config.colorize_logging` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:70`).
  `no_color!` is `Rails::Command::Behavior::ClassMethods#no_color!`
  (`railties/lib/rails/command/behavior.rb:12-14`): `Thor::Base.shell = Thor::Shell::Basic`.
  trails has no Thor shell — `GeneratorBase#say` / `#sayStatus`
  (`packages/trailties/src/generators/base.ts`) take a `color` argument and ignore it — so there
  is nothing for `no_color!` to switch. Port a shell seat with Color / Basic variants that
  `say_status` actually colors through, then `noColorBang`, and call it from `configureBang`.
  Rails test: `test_no_color_sets_proper_shell` (`railties/test/generators_test.rb:175-180`).
- The `ENGINE_PATH` arm of `Rails::Command::Actions#load_generators`
  (`railties/lib/rails/command/actions.rb:36-40`): `Engine.find(ENGINE_ROOT)`,
  `Rails::Generators.namespace = engine.railtie_namespace`, `engine.load_generators`.
  `loadGenerators` in `packages/trailties/src/command/actions.ts` ports the application arm only
  and carries `@missingRailsCall find — CONVERGEABLE generators-no-color-and-load-generators-engine-arm`.
  Needs an `ENGINE_ROOT` seat beside `ENGINE_PATH` (`packages/trailties/src/app-path.ts`), the
  `Generators.namespace` mattr (`generators.rb:27`), and `Engine#railtieNamespace`.

## Acceptance criteria

- `Generators.noColorBang()` exists and `configureBang` calls it when `colorizeLogging` is false,
  in Rails' order (`generators.rb:69-70`); `test_no_color_sets_proper_shell` ports.
- `loadGenerators` branches on `ENGINE_PATH` as `actions.rb:36-45` does, and the
  `@missingRailsCall find` receipt is removed.

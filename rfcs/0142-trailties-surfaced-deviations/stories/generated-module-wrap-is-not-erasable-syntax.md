---
title: "generated-module-wrap-is-not-erasable-syntax"
status: draft
updated: 2026-11-19
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

Generated code wraps Ruby `module Foo … end` as `export namespace Foo { … }`. Two generator helpers do it:

- `PluginGenerator#wrapInModules` (`packages/trailties/lib/generators/trails/plugin/plugin-generator.ts`, Rails `railties/lib/rails/generators/rails/plugin/plugin_generator.rb:405-412`), which every plugin `lib/` template uses (`lib/%namespaced_name%.ts.tt`, `engine.ts.tt`, `railtie.ts.tt`, `version.ts.tt`).
- `GeneratorBase#wrapWithNamespace` (`packages/trailties/lib/generators/base.ts`, Rails `railties/lib/rails/generators/base.rb:307-310`), used by `moduleNamespacing` in the controller functional-test, model, application-record and channel templates under an isolated engine.

A value-bearing `export namespace` is not erasable syntax. Node's strip-only type stripping rejects it (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`), and the generated app's own `tsconfig.json` sets `erasableSyntaxOnly: true`. So the output cannot run. This is the first blocker in `generated-plugin-bin-trails-cannot-boot`, where `lib/bukkits/engine.ts` fails on `bin/trails g controller`.

`plugin-generator.test.ts` (`:80`, `:87`, `:99`, `:166`) and `namespaced-generators.test.ts` assert on the `export namespace` text.

A second problem sits next to it: `lib/bukkits.ts` imports `./bukkits/engine.js`, and the engine's static block calls `isolateNamespace(Bukkits)` at module evaluation. Any shape where `engine.ts` imports the namespace object from `bukkits.ts` while `bukkits.ts` imports `engine.ts` hits a TDZ (or, with a top-level-await `import()`, a deadlock) depending on which file is the entry. `bin/trails` enters through `ENGINE_PATH` (`lib/bukkits/engine.ts`) and the dummy app enters through `lib/bukkits.ts`.

## Acceptance criteria

- [ ] A single erasable shape for a generated Ruby module is decided and recorded: a namespace object that each file seats on (CLAUDE.md § "Call-time constant resolution"), or directory-as-namespace.
- [ ] `wrapInModules` and `wrapWithNamespace` emit that shape, and the tests that pin `export namespace` text are converged to the new shape. Test names stay the same.
- [ ] A generated `--mountable` plugin's `lib/` loads under plain `node` both through `bin/trails` (`ENGINE_PATH`) and through `test/dummy/config/boot.ts`.

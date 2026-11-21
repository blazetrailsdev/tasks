---
title: "trailties-gemfile-entries-and-inheritance-remainder"
status: ready
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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

Left over from the bundle trailties-api-app-base-gemfile-entries / trailties-api-structure-inheritance-arity.

Still missing in `pnpm parity:api -- --package trailties --missing --inheritance`:

- `generators/app_base.rb`: `target_rails_prerelease` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:683-703`, writes a Gemfile, runs bundle, re-execs `rails new`; maps to package.json + `pnpm exec`). Also `plugin_generator.rb`'s `target_rails_prerelease` (`:239-241`), `gemfile_entries` (`:327-336`) and `simplify_gemfile_entries` (`:351-353`).
- `web_server_gemfile_entry`, `asset_pipeline_gemfile_entry`, `jbuilder_gemfile_entry`, `add_bundler_platforms`: trailties CLAUDE.md § "A Gemfile is a package.json" marks Puma, propshaft, jbuilder and `bundle lock --add-platform` permanent-not-ported, so they need a scoped skip in `scripts/parity/conventions.ts` citing that section (operator sign-off on widening the skip list).
- `@blazetrails` packages that `javascriptGemfileEntry` / `hotwireGemfileEntry` float (`vite-trails`, `turbo`, `stimulus`) resolve from npm under `--edge` / `--main`; only `--dev` overrides them to the checkout.
- Inheritance: `trailtie.ts:Railtie` / `engine.ts:Engine` / `test-unit/trailtie.ts:TestUnitRailtie` extend `Initializable` where Rails `include`s it (`railtie.rb`), via `include()` plus the `ClassMethods` extend from `initializable.rb:6-8`; `initializersChain` must walk `respond_to?(:initializers)` rather than `instanceof Initializable`. Same for `Bootstrap` / `Finisher`.
- `rack/logger.ts:Logger` must extend `ActiveSupport::LogSubscriber` (`rack/logger.rb:14-18`), read `logger` from it rather than an injected option, and take `taggers` positionally. Its Rack `call(env)` clashes with `LogSubscriber#call(event)` in TS.
- `TestUnitReporter` (`test_unit/reporter.rb:7`) and `TestParser < Ripper` (`test_unit/test_parser.rb:52`): the inheritance check must honour the trailties CLAUDE.md receipts (`INHERITANCE_SKIP_CLASSES`).

## Acceptance criteria

- [ ] Every member above matched or skip-receipted in `pnpm parity:api -- --package trailties --missing`.
- [ ] `--inheritance` shows 100% for trailties.

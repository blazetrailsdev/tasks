---
title: "Generated config/environments and filter-parameter-logging export values nothing reads, so they configure nothing"
status: draft
updated: 2026-09-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. The generator emits configuration
files whose exports nothing reads, so a generated app's per-environment
configuration is inert.

- `packages/trailties/src/generators/app-generator.ts:497-533` writes
  `config/environments/{development,test,production}.ts` as
  `export default { cacheClasses: ..., eagerLoad: ..., forceSSL: true, logLevel: "info", ... }`.
  The engine's `load_environment_config` initializer
  (`packages/trailties/src/engine.ts:201-210`) does
  `await import(pathToFileURL!(environment).href)` and discards the module. The
  default export never reaches `config`. The `environment()` generator action
  (`packages/trailties/src/generators/trails-actions.ts:95-96`) inserts code at
  the `// config` marker INSIDE that object literal, so generated settings are
  inert too.
- `config/initializers/filter-parameter-logging.ts` (`app-generator.ts:555`)
  is `export const filterParameters = [...]`. `load_config_initializers`
  (`engine.ts:150-158, 248-251`) likewise imports and calls nothing, and
  `config.filterParameters` (`application/configuration.ts:31`) stays `[]`.

trailmap carries all four files unchanged
(`config/environments/production.ts:1-9` sets `forceSSL: true`,
`eagerLoad: true`, `logLevel: "info"`, and none of it applies).

Rails' templates mutate the application's config as a side effect of loading:
`Rails.application.configure do config.enable_reloading = true ... end`
(`railties/lib/rails/generators/rails/app/templates/config/environments/development.rb.tt:3-7`)
and `Rails.application.config.filter_parameters += [...]`
(`.../config/initializers/filter_parameter_logging.rb.tt`). The initializers
that `load` them (`railties/lib/rails/engine.rb:691-695`) rely on that side
effect.

## Acceptance criteria

- The generated environment files configure the application the Rails way:
  `Trails.application.configure(function () { this.config.enableReloading = ...; })`,
  mirroring each `environments/*.rb.tt` setting by setting. `cacheClasses`
  becomes `enableReloading` where the Rails 8 template uses it.
- The generated `filter-parameter-logging.ts` appends to
  `Trails.application.config.filterParameters`, mirroring the `.rb.tt`
  including its key list.
- The `environment()` action inserts inside the `configure` body.
- A boot-app test proves a setting in `config/environments/test.ts` and one in
  `config/initializers/filter-parameter-logging.ts` are visible on
  `Trails.application.config` after `Trails.initialize()`.

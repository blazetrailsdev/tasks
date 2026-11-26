---
title: "trailties-test-railties-engine-rest"
status: claimed
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T22:44:51Z"
assignee: "trailties-test-application-configuration-harness-remainder"
blocked-by: null
closed-reason: null
---

## Context

`trailties-test-railties-engine` ported 38 of the 47 Miss rows of
`vendor/rails/v8.0.5.2/railties/test/railties/engine_test.rb` into
`packages/trailties/test/trailties/engine.test.ts`. These nine are still Miss:

- `rake environment can be called in the engine` (`:49`), `mountable engine should copy migrations within engine_path` (`:245`),
  `active_storage:install task works within engine` (`:1875`), `active_storage:update task works within engine` (`:1889`):
  each runs `rake` from the plugin directory through `rails/tasks/engine.rake` (`APP_RAKEFILE`); trails has no engine Rakefile harness yet.
- `don't reverse default railties order` (`:206`): needs `restrict_frameworks` (`:1912-1928`) ported onto the isolation harness.
- `i18n files have lower priority than application ones` (`:567`): `I18n.load_path` lists actionview's locale before
  activerecord's, because `@blazetrails/trailties`' entry imports actionview before `trailties/active-record.ts` imports
  `@blazetrails/activerecord` (Rails: `active_record/railtie.rb:3` requires `active_record` first, and nothing in `rails.rb`
  loads `action_view`). The test passes once that load order matches.
- `isolated engine routes and helpers are isolated to that engine` (`:822`) and
  `isolated engine should avoid namespace in names if that's possible` (`:967`): need a TSE `form_for` body and
  `respond_to?` / `polymorphic_path` reads through an isolated engine's helpers.
- `using namespace more than once on one module should not overwrite railtie_namespace method` (`:1219`): the engines
  reopen the application's own `AppTemplate` module; trails' generated `config/application.ts` seats `AppTemplate` with
  `constSet(TopLevel, "AppTemplate", {})` after the engine imports run, replacing the module the engines isolated
  (Ruby's `module AppTemplate` reopens it).

## Acceptance criteria

- [ ] All nine tests are ported with their Rails names and bodies and pass, with no Miss left for `engine_test.rb` in `pnpm parity:test -- --package trailties`.
- [ ] Lib fixes they need land in the same PR.

---
title: "AppGenerator#delete_new_framework_defaults"
status: done
updated: 2026-11-04
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9730
claim: "2026-11-04T20:11:23Z"
assignee: "activestorage-tests-run-inside-executor"
blocked-by: null
closed-reason: null
---

## Context

`AppGenerator#delete_new_framework_defaults`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:560-564`) removes
`config/initializers/new_framework_defaults_<MAJOR>_<MINOR>.rb` unless `options[:update]`. trails'
`AppGenerator` (`packages/trailties/src/generators/trails/app/app-generator.ts`) registers the
delete steps up to `deleteApiInitializers` (trails#9704) and stops; `deleteNewFrameworkDefaults`
is absent, as is the `new_framework_defaults` initializer template the update path writes.

## Acceptance criteria

- `AppGenerator#deleteNewFrameworkDefaults` exists at the Rails name, registered after
  `deleteApiInitializers`, removing `config/initializers/new-framework-defaults-<major>-<minor>.ts`
  unless `this.options.update`.
- The test that covers it in `app_generator_test.rb` is ported if one exists.

---
title: "app-update-command-and-api-public-files-test"
status: done
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9741
claim: "2026-11-05T15:06:26Z"
assignee: "mail-header-field-specs-and-content-field-rows"
blocked-by: null
closed-reason: null
---

## Context

`test_app_update_does_not_generate_public_files`
(`vendor/rails/v8.0.2/railties/test/generators/api_app_generator_test.rb:135-140`) calls
`run_app_update` (`railties/test/generators/generators_test_helper.rb:141-149`), which runs
`bin/rails app:update --force`. That is `Rails::Command::App::UpdateCommand`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/app/update_command.rb`), which trails has
not ported (`packages/trailties/src/commands/` has no `app/update`). `AppGenerator#updateConfigFiles`
and `AppBuilder#configWhenUpdating` landed with `api-app-generator-update-tests-and-initializer-deletes`.

## Acceptance criteria

- `Rails::Command::App::UpdateCommand` is ported (its `perform` invoking the `update_*` steps).
- A `runAppUpdate` test helper mirrors `generators_test_helper.rb:141-149`.
- `it("app update does not generate public files")` is ported in `packages/trailties/src/generators/api-app-generator.test.ts`.
- (from the closed duplicate `port-app-update-command-with-skip-option-preservation`) `generator_options` re-derives each skip flag from the running app as `update_command.rb:55-97` does. `skip_gem?` is read from the app's `package.json` (e.g. `skipEslint` is true when `eslint` is not a dependency), so `app:update` never re-adds a skipped tool.

---
title: "app-update-command-and-api-public-files-test"
status: draft
updated: 2026-11-04
rfc: "0212-trailties-port"
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

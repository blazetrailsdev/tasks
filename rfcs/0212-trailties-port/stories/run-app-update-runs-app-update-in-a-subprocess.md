---
title: "run-app-update-runs-app-update-in-a-subprocess"
status: ready
updated: 2026-11-07
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

Rails' `run_app_update` (`vendor/rails/v8.0.2/railties/test/generators/generators_test_helper.rb:141-149`) runs `bin/rails app:update` in a subprocess inside the generated app. So `UpdateCommand#generator_options`' `defined?(ActiveJob::Railtie)` / `defined?(Rails::TestUnitRailtie)` checks (`vendor/rails/v8.0.2/railties/lib/rails/commands/app/update_command.rb:63-82`) read the railties the generated `config/application.rb` loaded.

trails' `runAppUpdate` (`packages/trailties/src/generators/generators-test-helper.ts:48-58`, `@missingRailsCall system — PERMANENT`) invokes `app:update` in-process. Its `constDefined(TopLevel, ...)` checks (`packages/trailties/src/commands/app/update-command.ts:127-141`) see only the test process's railties, so an update comments out every framework import. So `app update preserves skip active job` / `action mailbox` / `action text` / `test` in `app-generator.test.ts` are parked as `it.skip`.

## Acceptance criteria

- `runAppUpdate` runs `bin/trails app:update <flags>` as a child process in the app root, as Rails' `system(...)` does, and the `@missingRailsCall system` receipt is removed.
- The four parked `app update preserves skip …` tests in `app-generator.test.ts` are un-skipped and pass.

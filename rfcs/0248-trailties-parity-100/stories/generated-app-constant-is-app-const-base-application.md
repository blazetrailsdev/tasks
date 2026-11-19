---
title: "generated-app-constant-is-app-const-base-application"
status: draft
updated: 2026-11-19
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

Rails' generated application is `module AppTemplate; class Application < Rails::Application`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/application.rb.tt`), so
`app_const` is `AppTemplate::Application` and `bin/rails initializers` prints
`AppTemplate::Application.set_added_development_module`
(`vendor/rails/v8.0.2/railties/test/commands/initializers_test.rb:27-41`).

trails' `config/application.ts.tt` emits `export class <%= this.appConstBase() %> extends Application`, so the
class's Ruby name is `AppTemplate` and the command prints `AppTemplate.set_added_development_module`.
`AppName#appConst` (`packages/trailties/lib/generators/app-name.ts:47-49`) already answers `AppTemplate::Application`.

`packages/trailties/test/commands/initializers.test.ts` "prints out initializers only specified in environment option"
is parked on this story.

## Acceptance criteria

- [ ] A generated application's class has the Ruby name `<AppConstBase>::Application`, so `rbModName` of it equals `appConst()`.
- [ ] The parked initializers test runs unskipped with Rails' literal strings.

---
title: "trailties: port Rails::Command::EnvironmentArgument and include it in DbconsoleCommand"
status: closed
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: EnvironmentArgument was ported in trails#8838 itself"
---

## Context

`Rails::Command::DbconsoleCommand`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/dbconsole/dbconsole_command.rb:67-68`)
is `include EnvironmentArgument`. The module
(`vendor/rails/v8.0.2/railties/lib/rails/command/environment_argument.rb:8-52`)
declares `class_option :environment, aliases: "-e"`, normalizes
`options[:environment]` in `initialize` (`:16-26`), and overrides
`require_application!` to set `ENV["RAILS_ENV"]` (`:29-32`).

trails ported the command in `packages/trailties/src/commands/dbconsole.ts`
without the module, which has no port. `trails dbconsole` therefore takes no
`-e` option and always reads `Command.environment`, and Rails'
`test_rails_env_is_development_when_environment_option_is_dev`
(`railties/test/commands/dbconsole_test.rb:107-111`) and the two help tests
(`:189-202`) have nothing to run against.

## Acceptance criteria

- [ ] `packages/trailties/src/command/environment-argument.ts` ports the module
      at its Rails names, with its `initialize` inlined into the including
      command's constructor under an `@inlinedFrom` tag.
- [ ] `DbconsoleCommand` includes it, and `trails dbconsole -e dev` resolves to
      `development`.
- [ ] The remaining `Rails::DBConsoleTest` cases are ported at their Rails names
      in `packages/trailties/src/commands/dbconsole.test.ts`.

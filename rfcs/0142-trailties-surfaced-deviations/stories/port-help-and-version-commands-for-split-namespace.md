---
title: "Port Rails::Command::HelpCommand / VersionCommand so split_namespace's help/version arms resolve"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command.split_namespace`
(`vendor/rails/v8.0.2/railties/lib/rails/command.rb:125-137`) maps `""` to
`["help", "help"]`, `HELP_MAPPINGS`/`"help"` to `["help", "help_extended"]`, and
`VERSION_MAPPINGS` to `["version", "version"]`. `find_by_namespace` then
resolves those to `Rails::Command::HelpCommand`
(`railties/lib/rails/commands/help/help_command.rb`) and `VersionCommand`
(`railties/lib/rails/commands/version/version_command.rb`).

trails#8197 ported those arms in `packages/trailties/src/command.ts`, but
`createProgram()` (`packages/trailties/src/cli.ts`) registers no `help` or
`version` command. So `findByNamespace("help", …)` misses, and `invokeRake`
hands the original token to commander's built-in `-h`/`-v` handling. The arms
are dead at runtime.

## Converged shape

Port `HelpCommand` (`help` and `help_extended`, which print the command
listing) and `VersionCommand` (prints `Trails <VERSION>`) as commander commands
under `commands/help.ts` and `commands/version.ts`, and register them in
`createProgram`. `invoke("")`, `invoke("--help")` and `invoke("-v")` then
resolve through `find_by_namespace` as Rails does.

## Acceptance criteria

- `invoke("-v")` / `invoke("--version")` print the version through the ported
  VersionCommand, and `invoke("")` / `invoke("-h")` through HelpCommand.
- The ported `railties/test/commands/help_test.rb` / `version_test.rb` cases (if any)
  pass under their Rails names.

---
title: "parity:api:inlined refuses @inlinedFrom on a commands/<dir>.ts command class constructor"
status: ready
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/commands/dbconsole.ts` inlines
`Rails::Command::EnvironmentArgument#initialize`
(`vendor/rails/v8.0.2/railties/lib/rails/command/environment_argument.rb:16-26`)
into `DbconsoleCommand`'s constructor, as root CLAUDE.md § "A module's
`initialize` is inlined into the constructor" requires. With the tag

`@inlinedFrom Rails::Command::EnvironmentArgument#initialize rails/v8.0.2/railties/lib/rails/command/environment_argument.rb:16-26`

`pnpm parity:api:inlined` (`scripts/api-compare/lint-inlined-from.ts`) reds:
"sits on a constructor whose file and name mirror no Rails class or module".
The class does mirror one: `Rails::Command::DbconsoleCommand`
(`railties/lib/rails/commands/dbconsole/dbconsole_command.rb:67`), which
includes the module (`:68`). trails#8838 shipped the constructor with no tag.

## Acceptance criteria

- [ ] `parity:api:inlined` resolves a `commands/<dir>/<dir>_command.rb` class
      for a constructor in `commands/<dir>.ts`, with a regression.
- [ ] `DbconsoleCommand`'s constructor carries the `@inlinedFrom` tag above and
      the gate is green.

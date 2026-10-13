---
title: "parity: the call comparer pairs DbconsoleCommand#perform with other EnvironmentArgument hosts' perform"
status: ready
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8838 ported `Rails::Command::DbconsoleCommand`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/dbconsole/dbconsole_command.rb:67-86`)
to `packages/trailties/src/commands/dbconsole.ts` with
`include(this, EnvironmentArgument)`. Before the include, `parity:api:calls`
paired `DbconsoleCommand#perform` with its own Ruby `perform` only. After it,
`scripts/api-compare/output/call-mismatches.json` carries two extra rows for the
same TS method, with `rubyFile` `commands/initializers/initializers_command.rb`
and `commands/runner/runner_command.rb`: two unported commands that also
`include EnvironmentArgument`. The rows report `application`, `executable`,
`help` and `say` as omitted, none of which `dbconsole_command.rb:82-85` calls.

They are baselined in
`scripts/api-compare/call-mismatches-exclude/trailties/commands/dbconsole.json`.

## Acceptance criteria

- [ ] The call comparer pairs a TS method only with the Ruby method of the
      class its file mirrors, not with a same-named method of another class
      that includes the same module; a comparer regression covers it.
- [ ] The four `perform` rows in `trailties/commands/dbconsole.json` are
      deleted and `pnpm parity:api:calls` is green.

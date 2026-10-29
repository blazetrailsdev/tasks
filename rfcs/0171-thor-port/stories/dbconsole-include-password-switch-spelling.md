---
title: "dbconsole's include_password switch is --includePassword, not Rails' --include-password"
status: ready
updated: 2026-10-29
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DbconsoleCommand` declares `class_option :include_password, aliases: "-p"`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/dbconsole/dbconsole_command.rb:70`).
With trails#9392 its options go through Thor's `classOption`, and
`packages/trailties/src/commands/dbconsole.ts` names it `includePassword`, so
Thor's switch is `--includePassword`. Rails' switch is `--include-password`, or
`--include_password`. The commander wrapper that accepted `--include-password`
before #9392 is gone.

## Acceptance criteria

- [ ] `trails dbconsole --include-password` (and `-p`) sets the option, as Rails' Thor switch does.
- [ ] `DBConsole.start` still reads the option under its camelCase key (an option-hash key is camelCase).

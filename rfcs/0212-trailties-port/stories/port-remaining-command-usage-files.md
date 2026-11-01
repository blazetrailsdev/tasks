---
title: "Port the remaining command USAGE files"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9592
claim: "2026-11-01T21:26:50Z"
assignee: "zeitwerk-loader-inflector-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/commands/{credentials,encrypted,runner,help,gem_help}/USAGE` have no trails counterpart; only `packages/trailties/src/commands/test/USAGE` exists (trails#9584). `Base.help` (`railties/lib/rails/command/base.rb:98-101`) prints `class_usage` when a USAGE file resolves, so `trails credentials --help` and `trails encrypted --help` omit their text. `runner_command.rb:17`, `help_command.rb:9` and `gem_help_command.rb:9` also read it. The `build:templates` script in `packages/trailties/package.json` copies and compiles only `dist/commands/test/USAGE`.

## Acceptance criteria

- Each USAGE whose command is ported exists under `packages/trailties/src/commands/<namespace>/USAGE`, translated as `commands/test/USAGE` was.
- `build:templates` copies and compiles each into `dist`.
- `trails credentials --help` and `trails encrypted --help` print their USAGE text.

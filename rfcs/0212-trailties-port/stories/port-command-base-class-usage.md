---
title: "port-command-base-class-usage"
status: draft
updated: 2026-11-01
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

`Rails::Command::Base.class_usage` / `usage_path`
(`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:100,122-135`) render a
command's `USAGE` file, and `TestCommand#help`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/test/test_command.rb:16-24`)
prints it (`commands/test/USAGE`). `packages/trailties/src/command/base.ts` has
neither, so `packages/trailties/src/commands/test.ts` `help` carries a
`@missingRailsCall class_usage` receipt.

## Acceptance criteria

- `Base.classUsage` and `usagePath` are ported at their Rails names.
- `trails test --help` prints the test command's USAGE text.
- The `class_usage` receipt in `commands/test.ts` is removed.

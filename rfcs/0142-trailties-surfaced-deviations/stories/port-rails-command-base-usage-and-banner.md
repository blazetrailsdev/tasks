---
title: "port-rails-command-base-usage-and-banner"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
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

`port-rails-command-base-thor-class-surface` ported `namespace`, `hide_command!`,
`perform`, `command_name`, `executable`, `bin` and Thor's `class_option` onto
`packages/trailties/src/command/base.ts`. It left out the rest of
`Rails::Command::Base`'s class body
(`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb`):

- `desc(usage = nil, description = nil, options = {})` (`:34-40`), whose else arm
  is `class_usage` (`:122-126`), which needs `usage_path` / `resolve_path`
  (`:129-132`, `:164-168`) and an ERB (TSE) render of the USAGE file
- `banner(command = nil, *)` (`:86-95`), which needs Thor's `formatted_usage`
- `base_name` (`:106-110`), `default_command_root` (`:139-142`),
  `printing_commands` (`:76-80`)

`unusedRoutesCommand()` in `packages/trailties/src/commands/unused-routes.ts`
still has no description, because Rails' `UnusedRoutesCommand` declares none
and has no USAGE file.

## Acceptance criteria

- The members above exist on `command/base.ts` at their Rails names with Rails'
  control flow; `resolve_path` reads the filesystem through ruby-compat's async fs.
- `printing_commands` feeds `Rails::Command.printing_commands`
  (`railties/lib/rails/command.rb:116-118`), which skips `hiddenCommands()`.

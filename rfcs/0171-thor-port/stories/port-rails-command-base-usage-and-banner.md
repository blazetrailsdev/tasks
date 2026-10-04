---
title: "port-rails-command-base-usage-and-banner"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  - vendor-thor-and-port-command-base-thor-surface
  - thor-cli-names-are-kebab-case-accept-snake-case-input
deps-rfc: []
est-loc: 300
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

Usage text follows RFC 0171 decision 6 ("Command and generator names are kebab-case on the command line", `thor-cli-names-are-kebab-case-accept-snake-case-input`): `banner` and `formatted_usage` print the kebab-case command and namespace. Rails' own banner tests assert snake_case text, and each one ported here asserts the kebab spelling instead.

## Acceptance criteria

- The members above exist on `command/base.ts` at their Rails names with Rails'
  control flow; `resolve_path` reads the filesystem through ruby-compat's async fs.
- `printing_commands` feeds `Rails::Command.printing_commands`
  (`railties/lib/rails/command.rb:116-118`), which skips `hiddenCommands()`.
- [ ] `banner` and the USAGE render show multi-word commands and namespaces in kebab-case. Each ported Rails assertion on snake_case usage text asserts the kebab spelling, with an `assertion-receipts.ts` row citing RFC 0171 decision 6. Test names are not changed.

## Thor port (the Thor-port RFC this story is rehomed into)

Depends on the Thor port: `banner` needs `Thor::Command#formatted_usage` (`vendor/thor/v1.3.2/lib/thor/command.rb:42-64`), and `desc`'s super arm is `Thor.desc` (`vendor/thor/v1.3.2/lib/thor.rb:54-64`). Estimated at 300.

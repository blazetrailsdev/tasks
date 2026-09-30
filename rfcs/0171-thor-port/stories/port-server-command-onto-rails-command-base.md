---
title: "Port ServerCommand onto Rails::Command::Base"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["vendor-thor-and-port-command-base-thor-surface"]
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These commands are commander factories today. Each builds a `new Command(...)` with
`.option(...)` / `.argument(...)` / `.action(...)` and is registered in
`createProgram()` (`packages/trailties/src/cli.ts:36-58`). In Rails each is a
`Rails::Command::Base` subclass (a `Thor`), with `class_option` / `desc` / `def perform`,
dispatched by `Rails::Command.invoke` → `find_by_namespace` → `klass.perform(command, args,
config)` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:45-72`):

- `vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb` → today `packages/trailties/src/commands/server.ts`

## Fidelity traps (predicted at authoring)

- [ ] **Options are Thor options.** Each Rails `class_option` / `method_option` is declared
      with the Rails name (camelCase, decision 6) and type, and read as `this.options.x` /
      `this.options.isX`. commander's `.option()` strings go away.
- [ ] **`perform` / subcommands are registered commands** (`desc` + `methodAdded`), and
      `no_commands` helpers use the `noCommands` shape.
- [ ] **`--help`** reaches `Rails::Command::Base.help` / `Thor.help`, not commander's help.

## Acceptance criteria

- [ ] Each command is a `Base` subclass in the file `parity:api` maps its `.rb` to
      (`commands/<name>.ts`), with Rails' members. Its commander factory is deleted, and
      `createProgram()` no longer registers it.
- [ ] Each command's railties test (`vendor/rails/v8.0.2/railties/test/commands/<name>_test.rb`, where
      one exists) keeps or grows its matched count.

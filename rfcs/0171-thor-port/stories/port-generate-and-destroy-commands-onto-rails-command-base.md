---
title: "Port GenerateCommand and DestroyCommand onto Rails::Command::Base"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "vendor-thor-and-port-command-base-thor-surface",
    "generator-base-thor-initialize-arguments-and-options-parse",
  ]
deps-rfc: []
est-loc: 300
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

- `vendor/rails/v8.0.2/railties/lib/rails/commands/generate/generate_command.rb` → today `packages/trailties/src/commands/generate.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/commands/destroy/destroy_command.rb` → today `packages/trailties/src/commands/destroy.ts`

`generate.ts` also hand-registers a `migration` subcommand (`packages/trailties/src/commands/generate.ts:14-25`), which goes away: `Rails::Generators.invoke` finds `MigrationGenerator` by namespace.

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

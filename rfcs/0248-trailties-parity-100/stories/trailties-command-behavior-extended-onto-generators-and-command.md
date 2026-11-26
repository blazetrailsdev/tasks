---
title: "trailties-command-behavior-extended-onto-generators-and-command"
status: draft
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
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

Rails mixes `Rails::Command::Behavior` (a Concern whose `class_methods` hold `no_color!`, `subclasses`, `print_list`,
`lookup`, `lookup!`, `namespaces_to_paths`; `vendor/rails/v8.0.5.2/railties/lib/rails/command/behavior.rb`) into both
`Rails::Generators` (`railties/lib/rails/generators.rb:15`) and `Rails::Command` (`railties/lib/rails/command.rb:41`).
`Generators` overrides `print_list` and calls `super` (`generators.rb:285-288`).

trails ports Behavior's class methods as free functions in `packages/trailties/lib/command/behavior.ts`, imported by
`lib/command.ts:21` and `lib/generators.ts:14`. So `Generators.printList` calls the imported function
(`printList as behaviorPrintList`) in place of `super`, and `Generators` carries its own copies of `subclasses`,
`lookup`, `lookupBang` and `namespacesToPaths`.

## Acceptance criteria

- [ ] `Command::Behavior` is a module whose class methods `extend()` installs on `Generators` and `Command` (CLAUDE.md, "Module mixins").
- [ ] `Generators.printList` reaches Behavior's `printList` the way Ruby's `super` does, with no import alias.
- [ ] Every Behavior method `Generators` duplicates either overrides it as Rails does or is deleted.

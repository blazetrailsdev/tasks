---
title: "Port Thor's class DSL (desc, long_desc, map, method_option(s), subcommand, register, check / stop / disable flags)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-base-command-registry-method-added-and-start"]
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/../thor.rb` (674 lines), the class-level DSL half: `package_name`, `default_command` (+
`default_task`), `register` (`:37-45`), `desc` (`:54-64`, including the `for:` arm),
`long_desc` (`:78-86`, `wrap:`), `map` (`:101-120`), `method_options` / `options`,
`method_option` / `option` (`:163-175`), `method_exclusive` / `exclusive`,
`method_at_least_one` / `at_least_one`, `subcommands` / `subtasks`, `subcommand_classes`,
`subcommand` / `subtask` (`:329-344`), `check_unknown_options!` / `check_unknown_options?`
(`:350-381`), `stop_on_unknown_option!` / `?`, `disable_required_check!` / `?`,
`command_exists?`, and protected `method_exclusive_option_names`,
`method_at_least_one_option_names`, `stop_on_unknown_option`, `disable_required_check`
(default `[:help]`), `create_command` (`:560-583`), `initialize_added` (`:586-589`) and
`subcommand_help` (`:641-647`).

## Fidelity traps (predicted at authoring)

- [ ] **Pending state.** `desc` / `long_desc` / `method_option` fill `@usage`, `@desc`,
      `@method_options` and so on, and `create_command` consumes and clears them
      (`@usage, @desc, ... = nil`). With explicit `methodAdded` (decision 1), this state machine
      is unchanged. Keep the ivars as own-property statics, cleared the same way.
- [ ] **`create_command`'s warning arm** (`:577-581`) `puts` a `[WARNING]` naming
      `caller[1]`. JS has no caller frame, so name the class and method instead, and record that
      at the call.
- [ ] **`subcommand` and `register` `define_method`** a forwarding command that calls
      `invoke`. In TS: assign the method on the prototype, then `methodAdded(subcommand)`.
- [ ] **`subcommand_help`** `class_eval`s a `help(command = nil, subcommand = true); super`
      override _on the subcommand class_. Install a real prototype method there.
- [ ] **`map`'s key** may be an Array (`HELP_MAPPINGS => :help`, `thor.rb:660`), and its value
      is a Symbol (`":help"`) compared against command names. Normalize the value the way
      `normalize_command_name` reads it (`map[meth].to_s`).
- [ ] **`check_unknown_options?`** compares `options[:except].include?(name.to_sym)`.
      `Array(value)` of Symbols against a command name: both are strings in trails. Keep the
      `except`-before-`only` order.
- [ ] **`stop_on_unknown_option | command_names`** is a set union, which is `rbArrayUnion`.

## Acceptance criteria

- [ ] The members above read complete in `parity:api --package thor` for `thor.rb`. The RSpec
      coverage is `port-thor-spec-part-1`.

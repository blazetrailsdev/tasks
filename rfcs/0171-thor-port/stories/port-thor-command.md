---
title: "Port Thor::Command, HiddenCommand and DynamicCommand (run, formatted_usage, arity and visibility arms)"
status: in-progress
updated: 2026-10-02
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-option", "ruby-compat-check-arity-raises-argument-error"]
deps-rfc: []
est-loc: 400
priority: 2
pr: trails#8414
claim: "2026-10-02T18:29:39Z"
assignee: "port-thor-command"
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/command.rb` (151 lines): `Command < Struct.new(:name, :description, :long_description,
:wrap_long_description, :usage, :options, :options_relation, :ancestor_name)`, `FILE_REGEXP`,
`initialize`, `initialize_copy` (the `find_and_refresh_command` clone path), `hidden?`,
`run(instance, args)` (`:21-38`), `formatted_usage(klass, namespace, subcommand)` (`:42-64`),
`method_exclusive_option_names` / `method_at_least_one_option_names`, and protected
`required_arguments_for`, `not_debugging?`, `required_options`, `public_method?`,
`private_method?`, `local_method?`, `sans_backtrace`, `handle_argument_error?`,
`handle_no_method_error?`. Also the `Task` / `HiddenTask` / `DynamicTask` aliases,
`HiddenCommand`, and `DynamicCommand` (`:137-149`, which refuses to run an existing method).

## Fidelity traps (predicted at authoring)

- [ ] **`run` is async.** `instance.__send__(name, *args)` may return a promise (every
      generator step awaits actions). `run` awaits it inside the `rescue`, so an `ArgumentError`
      or `NoMethodError` raised asynchronously reaches the handler arms.
- [ ] **Visibility.** `public_method?` / `private_method?` read `instance.public_methods` /
      `private_methods`. trails carries no method visibility at run time (CLAUDE.md § "Method
      visibility is compile-time only"), so `public_method?` answers "the instance defines the
      name" and `private_method?` answers `false`. What keeps a Thor-private method from being
      a command is the explicit `methodAdded` registration
      (`port-thor-base-command-registry-method-added-and-start`): a TS-`private` / `protected`
      or unregistered method is never in `all_commands`, so dispatch reaches it only through
      `DynamicCommand`, whose `instance.methods` arm (`:142-148`) refuses any defined name
      with `handle_no_command_error`. Do not add a visibility table or a per-class private
      list to make `private_method?` answer.
- [ ] **`command_spec.rb:70`** builds a bare `Class.new` with `private :can_has` and runs a
      hand-made `Command` against it, with no Thor registry in play. It turns on run-time
      visibility alone: keep the Rails-converged body as `it.skip` under a `PERMANENT-SKIP:`
      line citing CLAUDE.md § "Method visibility is compile-time only".
- [ ] **Arity.** Call `rbCheckArity` (from `ruby-compat-check-arity-raises-argument-error`)
      before the send, so the `rescue ArgumentError` arm fires where Ruby's VM would.
      `arity = instance.method(name).arity` is `rbObjMethod(...).arity()`.
- [ ] **`handle_argument_error?` / `sans_backtrace`** filter by backtrace frames. With the
      arity raised by `run` itself, the frame test is replaced by "raised by `rbCheckArity` for this
      call". Record that at the call site, since it is the one place the Ruby test cannot be
      mirrored.
- [ ] **`handle_no_method_error?`** matches ``undefined method `name' for #{instance}``. A JS
      `TypeError` (`x is not a function`) is not a `NoMethodError`, so only a ruby-compat
      `NoMethodError` takes this arm.
- [ ] **`local_method?(instance, :method_missing)`** (`:104-107`) checks the instance's
      _own class_ methods (`public_methods(false)`), which is the `methodMissing` arm of
      CLAUDE.md's method_missing table.
- [ ] **`Struct` members** are readable and writable (`command.usage = usage` in `desc
for:`), and `formatted_usage` concatenates with `" ".dup` (mutable Strings), which is a plain
      JS string build.

## Acceptance criteria

- [ ] `command.rb` reads complete in `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/command_spec.rb` is ported: 9 live, and `:70` parked as a
      permanent skip (see the trap above).

## Cases to port (10)

`vendor/thor/v1.3.2/spec/command_spec.rb`:

- `#formatted_usage > includes namespace within usage` (`:13`)
- `#formatted_usage > includes subcommand name within subcommand usage` (`:18`)
- `#formatted_usage > removes default from namespace` (`:23`)
- `#formatted_usage > injects arguments into usage` (`:28`)
- `#formatted_usage > allows multiple usages` (`:34`)
- `#dynamic > creates a dynamic command with the given name` (`:41`)
- `#dynamic > does not invoke an existing method` (`:48`)
- `#dup > dup options hash` (`:56`)
- `#run > runs a command by calling a method in the given instance` (`:64`)
- `#run > raises an error if the method to be invoked is private` (`:70`) — permanent skip

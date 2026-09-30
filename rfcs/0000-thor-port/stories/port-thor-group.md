---
title: "Port Thor::Group (invoke / invoke_from_option generated commands, class_options_help, dispatch, _invoke_for_class_method)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-invocation", "port-thor-dispatch-and-help"]
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

`vendor/thor/v1.3.2/lib/thor/group.rb` (292 lines): `desc` / `help`, `invocations` / `invocation_blocks`, `invoke`
(`:56-78`) and `invoke_from_option` (`:110-141`), each of which `class_eval`s a
`_invoke_<name>` / `_invoke_from_option_<name>` **command** at declaration time.
`remove_invocation`, `class_options_help` / `get_options_from_invocations` (`:161-196`),
`printable_commands`, `handle_argument_error` (`:207-212`), `command_exists?`, and protected
`dispatch` (`:228-245`, the `HELP_MAPPINGS` arm and `invoke_all`), `banner`, `self_command`,
`baseclass`, `create_command` (every public method is a command, `:263-266`), and the instance
`_invoke_for_class_method` (`:276-291`, `with_padding` plus block-arity dispatch).

Rails' generators are Thor::Groups (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:17`),
and `hook_for` is `invoke_from_option` (`base.rb:174-202`). trailties' copy:
`GeneratorBase.dispatch` / `invocations` / `invocationBlocks` / `invokeFromOption` /
`removeInvocation` / `_invokeForClassMethod` (`packages/trailties/src/generators/base.ts:343-690`).

## Fidelity traps (predicted at authoring)

- [ ] **Generated commands are commands.** `invoke` / `invoke_from_option` define a method and
      so fire `method_added`. In TS they assign the method on the prototype and call
      `this.methodAdded(name)` **at declaration time**, so a hook declared between two steps runs
      between them in `invoke_all` (the `ResourceGenerator` order; see the rehomed
      `generators-run-hooks-after-run-not-in-declaration-order`).
- [ ] **`name.to_s.gsub(/\W/, "_")`** builds the method name. In trails the result
      (`_invoke_from_option_test_framework`) is camelCased by the conventions table.
- [ ] **`verbose` defaults**: `options.fetch(:verbose, true)` for `invoke` and
      `fetch(:verbose, :white)` for `invoke_from_option`. The latter is a color, passed to
      `say_status` as `log_status`.
- [ ] **`value = name if TrueClass === value`** in the generated `_invoke_from_option_*`.
- [ ] **`_invoke_for_class_method`'s `case block.arity`** (3 → `yield(self, klass, command)`,
      2 → `yield(self, klass)`, 1 → `instance_exec(klass, &block)`). Use `Function#length`,
      and for arity 1 call with `this` bound to the instance.
- [ ] **`human_name = value.respond_to?(:classify) ? value.classify : value`**: the
      `classify` arm exists only when ActiveSupport is loaded. Thor must not import activesupport
      (`enroll-thor-specs-in-parity-test` boundary), so port it as `rbObjRespondTo(value,
"classify")`, false for a plain JS string. Record that at the call.
- [ ] **`handle_argument_error`** re-raises the _same_ error class with a new message
      (`raise error, msg`).

## Acceptance criteria

- [ ] `group.rb` reads complete in `parity:api --package thor`.
- [ ] The group / invocation RSpec port is `port-thor-group-and-invocation-specs`.

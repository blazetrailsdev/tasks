---
title: "Port Thor::Group (invoke / invoke_from_option generated commands, class_options_help, dispatch, _invoke_for_class_method)"
status: done
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: ["trailties", "ruby-compat"]
deps: ["port-thor-invocation", "port-thor-dispatch-and-help"]
deps-rfc: []
est-loc: 700
priority: 2
pr: trails#8526
claim: "2026-10-05T12:42:07Z"
assignee: "port-thor-group"
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
- [ ] **`name.to_s.gsub(/\W/, "_")`** builds the method name, and the interpolated name is kept
      verbatim. Only the identifier's own words are camelCased: `_invoke_#{name}` is
      `_invoke_${name}` and `_invoke_from_option_#{name}` is `_invokeFromOption_${name}`, so
      `_invoke_from_option_test_framework` is `_invokeFromOption_test_framework`. Camel-casing the
      name as well (`_invokeFromOptionTestFramework`, this story's first spelling) merges names
      Thor keeps apart: `invoke "Foo", "foo"` defines `_invoke_Foo` and `_invoke_foo`
      (`vendor/thor/v1.3.2/lib/thor/group.rb:64-65,123-124`), and both would be `_invokeFoo`, losing
      one hook. Raised in review of trails#8526.
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

## Scope added in review (trails#8526)

Two prerequisites surfaced in review of the port and ship with it, because `group.ts` cannot be
faithful without either:

- **`rbObjAsString` of a class.** `invoke` builds the generated method's name from `name.to_s`
  (`vendor/thor/v1.3.2/lib/thor/group.rb:60-69`), and a name may be a class. Ruby's
  `rb_obj_as_string` (`vendor/ruby/v3.3.11/string.c:1653`) sends `to_s`, which for a class is
  `rb_mod_to_s` (`vendor/ruby/v3.3.11/object.c:1681`). ruby-compat's `rbObjAsString`
  (`packages/ruby-compat/src/object.ts`) answered a JS class's source text. This is the whole of
  `rb-obj-as-string-of-a-class-answers-its-source-text` (RFC 0154), closed by the same PR.
- **The call gate's include seam.** `Thor::Group` defines no `initialize`; it inherits
  `Thor::Base#initialize` (`vendor/thor/v1.3.2/lib/thor/base.rb:53-113`) through
  `include Thor::Base` (`group.rb:270`), and its constructor is the
  `initializeIncludedModules(this, ...args)` chain seat. `scripts/api-compare/compare.ts` compared
  that constructor against the module's body, which only seven `@missingRailsCall` receipts could
  quiet. The gate reads a constructor that calls `initializeIncludedModules` and nothing else as
  the include seam. This is the first acceptance criterion of
  `call-gate-pairs-includer-constructor-with-included-module-initialize`; the extractor half
  stays there.

## Acceptance criteria

- [ ] `group.rb` reads complete in `parity:api --package thor`.
- [ ] `rbObjAsString(SomeClass)` answers the class name, and an overridden class `toS` still wins.
- [ ] `Group`'s constructor carries no `@missingRailsCall`, and `pnpm parity:api:calls` is green.
- [ ] The group / invocation RSpec port is `port-thor-group-and-invocation-specs`.

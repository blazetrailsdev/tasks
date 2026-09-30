---
title: "Port Thor::Base's command registry, explicit method_added registration, subclass registry, namespace and start"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-base-options-and-arguments-dsl"]
deps-rfc: []
est-loc: 500
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The other half of `vendor/thor/v1.3.2/lib/thor/base.rb`:

- `Thor::Base.subclasses` / `register_klass_file` (`:128-150`), `ClassMethods#commands` /
  `all_commands` / `remove_command` (`:471-509`), `no_commands` / `no_commands_context` /
  `no_commands?` (`:530-542`), the `attr_reader` / `attr_writer` / `attr_accessor` overrides that
  wrap `no_commands` (`:154-164`), `namespace` (`:566-572`), `start` (`:582-594`),
  `public_command` (`:606-611`), `handle_no_command_error`, `handle_argument_error`
  (`:618-625`), `exit_on_failure?` (`:628-631`, with the deprecation), and protected
  `class_options_help` / `print_options` (`:638-674`), `inherited` (`:721-725`), `method_added`
  (`:729-745`), `basename`, and the `baseclass` / `create_command` / `initialize_added` /
  `dispatch` signatures (`:777-794`).

## Design (RFC decisions 1, 2 and 5)

- **`method_added` is fired explicitly** at the position of the Ruby `def`: a class's
  `static {}` block calls `this.methodAdded("install")` after that command's `desc` /
  `method_option` calls. The ported `methodAdded` body is line-for-line: the
  `initialize → initialize_added` arm, `public_method_defined?` (via the visibility side table),
  `no_commands?`, `create_command`, `is_thor_reserved_word?`, `register_klass_file`.
- **`no_commands`** is ported verbatim over `NestedContext`. A helper is declared as
  `this.noCommands(() => this.methodAdded("helper"))`, the same shape as Ruby's
  `no_commands do def helper; end end`.
- **`inherited`** is `tsMirrorIsDrift` (`scripts/parity/conventions.ts:592-595`). Its two
  effects are deferred: `@no_commands = 0` becomes the own-property memo guard, and
  `register_klass_file` runs from `methodAdded` (where Thor also calls it, `:744`) and from
  `namespace(name)` when set explicitly. A class with neither never enters
  `Thor::Base.subclasses`. Record that at `subclasses`, since it is the one observable
  difference from Ruby.
- `register_klass_file`'s `caller`-file arm feeds only `subclass_files` (Runner). It is not
  ported (scoped skip in `enroll-thor-specs-in-parity-test`).

Add the CLAUDE.md section **"Thor commands register through an explicit `methodAdded`"**,
which ratifies decisions 1, 2 and 5 with the alternatives from the RFC.

## Fidelity traps (predicted at authoring)

- [ ] **`start` is async** and awaits `dispatch`. The `rescue Thor::Error` arm prints through
      `config[:shell].error` unless `config[:debug] || ENV["THOR_DEBUG"] == "1"`, and then
      `exit(false) if exit_on_failure?`. `rescue Errno::EPIPE` exits `true`
      (`exit_condition_spec.rb`). Use ruby-compat's `exit` and `Errno::EPIPE`.
- [ ] **`given_args.dup`**: `start` never mutates the caller's array.
- [ ] **`namespace`'s default** is `Thor::Util.namespace_from_thor_class(self)`, which reads
      the class's **Ruby constant name**. JS `class.name` is the bare identifier, so classes carry
      their Ruby constant path the way trailties railties already do
      (`Object.defineProperty(klass, "name", ...)`; see
      `generator-base-name-derived-from-bare-js-class-name`).
- [ ] **`all_commands` merges on every call** (`@all_commands.merge!(commands)`, `:484`), so a
      command added to a parent after the child first read `all_commands` still appears. Keep the
      merge; do not memoize the result.
- [ ] **`public_command`** redefines each name as `def name(*); super end`. In TS it
      re-exposes a parent's method on the subclass prototype and records it public in the
      visibility table.
- [ ] **`print_options`' padding** is `aliases_for_usage.size.max.to_i` (`nil.to_i` is 0).

## Acceptance criteria

- [ ] `thor/base.rb` reads complete in `parity:api --package thor`, except the scoped
      `subclass_files` skip.
- [ ] The CLAUDE.md section is added, and `thor-command-registration-lint-rule` is referenced
      from it.
- [ ] `vendor/thor/v1.3.2/spec/exit_condition_spec.rb` (1) is ported.

## Cases to port (1)

`vendor/thor/v1.3.2/spec/exit_condition_spec.rb`:

- `Exit conditions > exits 0, not bubble up EPIPE, if EPIPE is raised` (`:5`)

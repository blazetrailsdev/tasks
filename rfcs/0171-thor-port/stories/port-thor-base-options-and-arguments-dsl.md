---
title: "Port Thor::Base's option / argument DSL and #initialize (class_option, argument, exclusive / at-least-one, from_superclass)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-options-parser", "port-thor-command"]
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

`vendor/thor/v1.3.2/lib/thor/base.rb` (825 lines) is split in two stories. This one owns the option and argument
half and `Thor::Base#initialize`:

- constants `HELP_MAPPINGS`, `THOR_RESERVED_WORDS`, `TEMPLATE_EXTNAME` (`:17-23`; the last is
  already in `packages/trailties/src/thor/base.ts`), and `Thor.deprecation_warning` (`:25-32`);
- `attr_accessor :options, :parent_options, :args` and `initialize(args, local_options, config)`
  (`:35-113`): `command_options`, Array vs Hash `local_options`, relations,
  `Thor::Options.new(...).parse`, `config[:class_options]` merge, `check_unknown!`,
  `strict_args_position?`, and `Thor::Arguments` assigning through `"#{k}="`;
- `ClassMethods`: `check_unknown_options!` / `check_unknown_options` / `check_unknown_options?`,
  `check_default_type!`, `allow_incompatible_default_type!`, `check_default_type`,
  `stop_on_unknown_option?`, `disable_required_check?`, `strict_args_position!` (+ reader /
  predicate), `argument` (`:261-286`), `arguments`, `class_options`, `class_option`,
  `class_exclusive`, `class_at_least_one`, `class_exclusive_option_names`,
  `class_at_least_one_option_names`, `remove_argument`, `remove_class_option`, `group`;
- protected `is_thor_reserved_word?`, `build_option`, `build_options`, `find_and_refresh_command`,
  `from_superclass` (`:749-766`; already ported in `thor/base.ts`), `register_options_relation_for`,
  `built_option_names`, `command_scope_member`.

trailties' copies it replaces: `GeneratorBase.classOption` / `classOptions` / `removeClassOption`
(`packages/trailties/src/generators/base.ts:296-316`) and `command/base.ts`' `classOption` /
`classOptions` (`packages/trailties/src/command/base.ts:81-95`). Their convergence is a
consumer story; this one ports the Thor side.

## Fidelity traps (predicted at authoring)

- [ ] **`argument` defines `name` / `name=` accessors** inside `no_commands` (`:263`), and
      `initialize` assigns through them (`__send__("#{k}=", v)`). Port the accessor pair as a
      prototype accessor (CLAUDE.md § "Generated attribute readers are properties"), so a subclass
      reads `this.name`.
- [ ] **`from_superclass` dups** the parent's value (`value.dup`, `:760`), so a subclass's
      `class_options` never mutates its parent's. The own-property memo guard is the `inherited`
      deferral (CLAUDE.md § "`inherited` is deferred").
- [ ] **`required` resolution order** in `argument` (`:265-271`): `:optional` first, then
      `:required`, then `options[:default].nil?`. `key?`, not truthiness.
- [ ] **`class_exclusive` / `class_at_least_one` with a block** evaluate the block with
      `instance_eval` against the class and diff the option names before and after
      (`built_option_names`, `:808-813`). In TS the block receives the class as `this`.
- [ ] **`is_thor_reserved_word?` raises a bare `RuntimeError`** (`raise "..."`), not `Thor::Error`.
- [ ] **`class_option` name check** raises `ArgumentError` for a non-Symbol/String. In trails
      both are JS strings, so only the non-string arm remains.

## Acceptance criteria

- [ ] The members above read complete in `parity:api --package thor` for `thor/base.rb`.
- [ ] `.trails.test.ts` cases for each trap. The RSpec port is `port-thor-base-spec`.

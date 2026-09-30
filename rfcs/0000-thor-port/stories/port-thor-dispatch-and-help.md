---
title: "Port Thor.dispatch, command-name resolution and the help screens (Thor.help, command_help, Thor#help)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-class-dsl", "port-thor-util", "port-thor-shell-printers"]
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

`vendor/thor/v1.3.2/lib/thor/../thor.rb`, the runtime half: `dispatch` (`:505-539`), `retrieve_command_name`
(`:592-595`), `normalize_command_name` (`:605-620`, which raises `AmbiguousTaskError`),
`find_command_possibilities` (`:626-638`, prefix matching), `banner` (`:546-550`),
`baseclass`, `dynamic_command_class`, `command_help` (`:258-280`), `help` (class, `:288-306`),
`printable_commands` (`:309-317`), `print_exclusive_options`,
`print_at_least_one_required_options`, `sort_commands!`, and the instance `help`
(`:663-673`, the root command declared with `map HELP_MAPPINGS => :help` and
`desc "help [COMMAND]"`, `:658-662`).

This is what `bin/trails --help`, `bin/trails <cmd> --help`, and unknown-command errors print
once commander is retired. `command.ts`'s `HELP_MAPPINGS` (`packages/trailties/src/command.ts:4`)
is railties' own constant and stays.

## Fidelity traps (predicted at authoring)

- [ ] **`dispatch` yields the instance** (`yield instance if block_given?`) before
      `invoke_command`. `Invocation#invoke` uses that to set `parent_options`. Port it as an
      optional callback parameter, and await `invoke_command`.
- [ ] **`trailing = args[Range.new(arguments.size, -1)]`**: an out-of-range start gives `nil`,
      and `trailing || []` handles it.
- [ ] **`retrieve_command_name`**: `args.shift if meth && (map[meth] || meth !~ /^\-/)`. The
      return value is the shifted element or `nil`.
- [ ] **`find_command_possibilities`** sorts, then `.map { |k| map[k] || k }.uniq`, and prefers
      an exact match. Ruby `sort` on Strings is bytewise, so use a code-unit comparison, not
      `localeCompare`.
- [ ] **`$thor_runner`** (a global) gates namespace display in `banner` and in
      `handle_no_command_error`. Port it as a module-level seat, default `false`, which the spec
      helper sets to `true` (`vendor/thor/v1.3.2/spec/helper.rb:27`).
- [ ] **`printable_commands`' `description.gsub(/\s+/m, " ")`**, and `list.sort! { |a,b| a[0]
<=> b[0] }`.
- [ ] **Instance `help` is itself a command**, registered with `desc` + `methodAdded("help")`
      in `Thor`'s own static block, so `all_commands` includes it for every subclass.

## Acceptance criteria

- [ ] `thor.rb` reads complete in `parity:api --package thor`. The RSpec coverage is
      `port-thor-spec-part-2`.

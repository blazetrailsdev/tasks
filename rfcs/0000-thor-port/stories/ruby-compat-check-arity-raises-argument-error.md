---
title: "ruby-compat: rbCheckArity raises Ruby's 'wrong number of arguments' ArgumentError"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Command#run` (`vendor/thor/v1.3.2/lib/thor/command.rb:21-38`) calls `instance.__send__(name, *args)` and
rescues `ArgumentError`. When `handle_argument_error?` (`:114-119`) matches the message
`/wrong number of arguments/`, the class reports usage: `Base.handle_argument_error`
(`vendor/thor/v1.3.2/lib/thor/base.rb:618-625`, `ERROR: "thor one_arg" was called with no arguments`) or
`Group.handle_argument_error` (`vendor/thor/v1.3.2/lib/thor/group.rb:207-212`). Five `thor_spec.rb` cases
(`vendor/thor/v1.3.2/spec/thor_spec.rb:470-482`), `group_spec.rb:39,140` and `subcommand_spec.rb:67` assert that
output.

**JS never checks call arity**: a missing argument is `undefined`, and an extra one is
dropped. So the rescue arm is unreachable unless something raises in Ruby's place.
ruby-compat already computes Ruby's `Method#arity` from a function's parameter list
(`packages/ruby-compat/src/method.ts:55-95`).

## Acceptance criteria

- [ ] `rbCheckArity(method, argc)` raises `ArgumentError` with MRI's message:
      `wrong number of arguments (given N, expected M)`, `(given N, expected M+)` or
      `(given N, expected M..K)` (`vendor/ruby/v3.3.11/vm_args.c` `argument_arity_error`).
- [ ] It reads the same parameter list `Method#arity` does, so a default parameter widens
      the range and a rest parameter removes the upper bound. The parser moves into a shared
      helper instead of being copied.

---
title: "generator-base-thor-initialize-arguments-and-options-parse"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

Thor builds a generator in `Thor::Base#initialize(args, local_options, config)`
(thor 1.3.2 `lib/thor/base.rb`, installed gem, not vendored):

- An Array `local_options` is parsed by `Thor::Options.new(class_options, hash_options, …).parse(array_options)`.
- The remaining arguments go through `Thor::Arguments.new(self.class.arguments).parse(...)`,
  which assigns each declared `argument` (`name`, `attributes`, `actions`, …) through its
  accessor.
- Commands run with no arguments (`invoke_command` → `command.run(self, *args)`,
  `invocation.rb:126-133`) and read `name` / `attributes` off `self`.

In trails (`packages/trailties/src/generators/base.ts`):

- `GeneratorBase`'s constructor takes one pre-parsed options hash (Thor's `hash_options`
  arm), and the switch parser that used to be inline in `start` now sits inline in the
  private `dispatch` (trails#8228).
- Generators declare `run(name, attributes)`. `invokeCommand` passes those positionally
  where Thor passes nothing.
- The parser's grammar is trails' own, not `Thor::Options`': `--x=y`, `-x y`,
  `--no-x` / `--skip-x` for booleans, enums and numerics. It has no `-abc` switch
  clustering, `--`, hash or array options, or `check_unknown!`.

## Acceptance criteria

- `GeneratorBase` gains the Thor `argument` declaration and accessors, and the array-options
  parse moves out of `dispatch` into the construction path, as `Thor::Base#initialize` does.
- Generators' `run` reads `this.name` / `this.attributes` rather than taking parameters, and
  `invokeCommand` calls commands with no arguments.
- The option grammar converges on `Thor::Options#parse`.

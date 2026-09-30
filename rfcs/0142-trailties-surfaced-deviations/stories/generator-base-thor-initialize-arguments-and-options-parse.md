---
title: "GeneratorBase is constructed by Thor::Base#initialize: Thor::Options parse, argument accessors, zero-arg commands"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps:
  [
    "rebase-generator-base-onto-thor-group",
    "port-thor-base-options-and-arguments-dsl",
    "port-thor-options-parser",
    "port-thor-core-ext-hash-with-indifferent-access",
  ]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Thor builds a generator in `Thor::Base#initialize(args, local_options, config)`
(`vendor/thor/v1.3.2/lib/thor/base.rb:53-113`):

- An Array `local_options` is parsed by `Thor::Options.new(class_options, hash_options, …).parse(array_options)`
  (`:93-95`).
- The remaining arguments go through `Thor::Arguments.new(self.class.arguments).parse(...)`,
  which assigns each declared `argument` (`name`, `attributes`, `actions`, …) through its
  accessor (`:110-112`).
- Commands run with no arguments (`invoke_command` → `command.run(self, *args)`,
  `vendor/thor/v1.3.2/lib/thor/invocation.rb:122-129`) and read `name` / `attributes` off `self`.

In trails (`packages/trailties/src/generators/base.ts`):

- `GeneratorBase`'s constructor takes one pre-parsed options hash (Thor's `hash_options` arm),
  and the switch parser is inline in the private `dispatch` (trails#8228).
- Generators declare `run(name, attributes)`, and `invokeCommand` passes those positionally
  where Thor passes nothing.
- The parser's grammar is trails' own, not `Thor::Options`'. It has no `-abc` switch
  clustering, `--`, hash or array options, or `check_unknown!`.

## Acceptance criteria

- [ ] `GeneratorBase`'s constructor is `Thor::Base#initialize` (with `Thor::Actions#initialize`'s
      behavior arm and `Thor::Shell#initialize`), taking `(args, localOptions, config)`. The inline
      parser in `dispatch` is gone.
- [ ] `NamedBase` / `AppBase` / each generator declares its Rails `argument`s. Every `run`
      becomes zero-arg and reads `this.name` / `this.attributes`.
- [ ] Options are the frozen `Thor::CoreExt::HashWithIndifferentAccess` and are read as
      `this.options.x` / `this.options.isX` (decision 6). Option names keep their camelCase
      spelling, and the CLI spelling (`--skip-git`) is `Thor::Option#switch_name`'s.
- [ ] The `@missingRailsArgs new` / `@missingRailsArgs run` receipts citing this story
      (`packages/trailties/src/generators/base.ts:354,599`) are removed.

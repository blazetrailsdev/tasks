---
title: "move-hand-written-generate-subcommand-flags-onto-generators"
status: draft
updated: 2026-09-25
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

`packages/trailties/src/commands/generate.ts` hand-registers four subcommands
(`model`, `migration`, `controller`, `scaffold`) that construct their generator
directly and carry flags as Commander options (`model`'s `--no-migration`,
`--no-test`, `--no-timestamps`). Rails has no such split: every generator is
reached through `Rails::Generators.invoke` → `klass.start(args, config)`
(`railties/lib/rails/generators.rb:259-265`), and its flags are Thor
`class_option`s on the generator — e.g. `class_option :migration` /
`:timestamps` / `:parent` / `:indexes` / `:primary_key_type` / `:database`
(`activerecord/lib/rails/generators/active_record/model/model_generator.rb:12-17`);
`--no-test` is Rails' `hook_for :test_framework` (`--no-test-framework`).

`GeneratorBase.classOption` / `GeneratorBase.start` now parse declared options
(wire-generator-class-options-through-trails-generate), and the
lookup-registered subcommands pass raw args through and advertise the options in
`--help`. The four hand-written ones still bypass it. Complicating factor: the
`model` subcommand uses `generators/model-generator.ts`, while lookup registers
`generators/rails/model/model-generator.ts` — two `ModelGenerator`s.

## Acceptance criteria

- The four hand-written subcommands are removed from `generate.ts`; their
  generators are reached through `Generators.invoke` like every other one.
- Their flags are `classOption`s on the generator, named as Rails names them
  (`migration`, `timestamps`, `parent`, `indexes`, `primaryKeyType`, `database`;
  `testFramework` via `hook_for` rather than an invented `test`).
- One `ModelGenerator` remains.

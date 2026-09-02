---
title: "wire-generator-class-options-through-trails-generate"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
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

`Rails::Generators::Base` inherits Thor's `class_option`, and
`Rails::Generators.invoke` hands the raw ARGV to `klass.start(args, config)`
(`vendor/rails/railties/lib/rails/generators.rb:265`), where Thor parses the
declared options off it. trails has no `class_option` port, so PR #7368's
`GeneratorBase.start` (`packages/trailties/src/generators/base.ts`) passes only
positional arguments and every generator whose `run()` takes an options object
receives an empty one.

Three generators are affected — their `run()` options are unreachable from
`trails generate <name>`:

- `AuthenticationGenerator.run({ api, skipMailer, skipActionCable })`
  (`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:30`)
  — Rails' `class_option :api`
  (`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:6-7`).
- `GeneratorGenerator.run({ namespace })`
  (`packages/trailties/src/generators/rails/generator/generator-generator.ts:13`)
  — Rails' `class_option :namespace, type: :boolean, default: true`
  (`railties/lib/rails/generators/rails/generator/generator_generator.rb:8-9`).
- `DevcontainerGenerator`'s constructor options
  (`packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts:23-46`)
  — Rails' `class_option`s in
  `railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb`.

The four hand-written `generate.ts` subcommands (`model`, `migration`,
`controller`, `scaffold`) carry their flags as Commander options instead, which
is the same gap seen from the other side: the flags live in the CLI rather than
on the generator.

## Acceptance criteria

- `Rails::Generators::Base.class_option` (Thor) has a trails port, and
  `GeneratorBase.start` parses the declared options off `args` the way Thor
  does before calling the generator.
- `trails generate authentication --api` and
  `trails generate generator foo --no-namespace` reach `run()`'s options.
- The lookup-registered subcommands in `commands/generate.ts` advertise each
  generator's declared options in `--help`, and the four hand-written
  subcommands' Commander flags move onto their generators.

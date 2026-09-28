---
title: "trails-new-reaches-app-generator-start"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `trails new` reaches `AppGenerator.start` instead of hand-registering Commander flags

## Context

Rails' `rails new` hands ARGV to `Rails::Generators::AppGenerator.start`
(`railties/lib/rails/commands/application/application_command.rb`), and Thor parses every
`class_option` declared on `AppBase` / `AppGenerator` generically, as `rails generate` does.
trails' `trails generate` already works this way: `commands/generate.ts:44-56` forwards raw
args through `Generators.invoke` → `GeneratorBase.start()` (`generators/base.ts`).

`commands/new.ts`, however, hand-registers each flag on Commander (`--skip-docker`,
`--skip-eslint` / `--no-skip-eslint`, `--database`, …) and spreads them into
`new AppGenerator({...})`. So every new `AppBase` class option (e.g. `skipEslint`,
`app_base.rb:100`) needs a second, hand-written registration in `new.ts`.
`GeneratorBase.start` currently constructs `new this({ ...config, ...options, name, attributes })`
and calls `run(name, attributes)`, while `AppGenerator` takes `appPath` and a zero-arg `run()`,
so the two do not line up yet.

## Acceptance criteria

- `trails new <path> [flags]` parses its flags through `AppGenerator.start` (the `class_option`
  registry), with no per-flag Commander registration for options `AppBase` / `AppGenerator` declare.
- `skipDocker` and the other hand-written `new.ts` switches that Rails declares as `class_option`s
  (`app_base.rb:40-120`) become class options.
- The post-generation steps `new.ts` runs (git init, install) keep working.

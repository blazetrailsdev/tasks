---
title: "generate-command-boots-application-before-invoking"
status: draft
updated: 2026-09-27
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

Rails' `GenerateCommand#perform`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/generate/generate_command.rb:17-27`)
calls `boot_application!` before `Rails::Generators.invoke`, so every generator
runs with `Rails.application` loaded and its config applied.

trails' `packages/trailties/src/commands/generate.ts` constructs generators
(e.g. `new MigrationGenerator({ cwd: Dir.pwd(), ... })` in the `migration`
subcommand) without loading `config/application.ts`. So `Trails.application` is
null while a generator runs. `GeneratedAttribute#isRequired`
(`packages/trailties/src/generators/generated-attribute.ts`, the port of
`generated_attribute.rb:192-194`) therefore reads
`Trails.application?.config.activeRecord?.belongsToRequiredByDefault` behind
optional chains Rails does not have. From the real CLI it always answers false,
so `trails generate migration AddAuthorToBooks author:references` omits Rails'
`null: false`.

## Acceptance criteria

- `trails generate` boots the application (`boot_application!`) before invoking
  a generator.
- `GeneratedAttribute#isRequired` reads
  `Trails.application!.config.activeRecord.belongsToRequiredByDefault` with no
  optional chains, and the generator tests that reach it set up an application
  as Rails' generator test helper does.
- Rails' `model_generator_test.rb` "null false is added for references by default"
  and its two siblings (currently `it.skip` in `model-generator.test.ts`) are ported.

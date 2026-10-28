---
title: "converge-generators-onto-thor-template"
status: draft
updated: 2026-10-28
rfc: "0171-thor-port"
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

`converge-generator-base-create-file-onto-thor-actions` deleted `GeneratorBase`'s trails-only
`createFile` / `emptyDirectory` / `appendToFile` / `revokeInjection` / `getCreatedFiles`; every
generator now awaits Thor's `createFile` (`packages/thor/src/actions/create-file.ts`). What is
left is the content side: the generators still build file bodies inline in TS and hand them to
`createFile`, where Rails calls `template` over a source file under the generator's `templates/`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/task/task_generator.rb:8-10`, and every
`@missingRailsCall template — CONVERGEABLE converge-generators-onto-thor-template` receipt).

Also outstanding:

- `TestUnit::Generators::ModelGenerator#create_test_file` / `#create_fixture_file`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/model/model_generator.rb:15-25`)
  call `template`; `packages/trailties/src/generators/test-unit/model/model-generator.ts` calls
  `createFile`.
- The private `template` copies over the in-memory `TEMPLATES` map in
  `packages/trailties/src/generators/app-generator.ts` (`AppGenerator#template`),
  `rails/db/system/change/change-generator.ts` (with its invented `writeOrUpdate`), and both
  `authentication-generator.ts` files shadow Thor's `template`
  (`packages/thor/src/actions/file-manipulation.ts:109`). Rails' `edit_database_config` is
  `template(database.template, "config/database.yml")` (`change_generator.rb:36-38`).
- `ActionMethods`' typed `createFile` / `emptyDirectory` / `template` forwarders in
  `app-generator.ts` stand in for its `method_missing`.

## Acceptance criteria

- [ ] Each generator carrying the receipt calls Thor's `template` over a source file in its
      `templates/` directory, and the receipt is removed.
- [ ] The private `template` copies in `app-generator.ts`, `change-generator.ts` and both
      authentication generators are deleted; `GeneratorBase` declares Thor's `template`.
- [ ] `NamedBase#template` overrides Thor's `template` to record the file through
      `Generators.addGeneratedFile(super)` inside `inside_template`
      (`vendor/rails/v8.0.2/railties/lib/rails/generators/named_base.rb:20-27`); until it does, a
      named generator's files reach no `after_generate` callback (`generators.rb:319`).
- [ ] Split by LOC under the ceiling, one generator family per PR.

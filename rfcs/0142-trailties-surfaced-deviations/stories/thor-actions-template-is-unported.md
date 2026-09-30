---
title: "thor-actions-template-is-unported"
status: draft
updated: 2026-09-30
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

Thor's `template` action (`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb:117-132`)
is unported. #8269 ported `source_root` / `source_paths` / `find_in_source_paths`
(`packages/trailties/src/thor/actions.ts:71`), and the migration generator
renders its `.tt` in line (`packages/trailties/src/generators/migration-generator.ts:67-78`:
`findInSourcePaths`, `compileJs`, `new Function`, `OutputBuffer`), but there is no
shared `template(source, destination, config)` on `Thor::Actions`. Two
generators hand-roll a private `template` instead
(`generators/app-generator.ts:55,1399`, `rails/db/system/change/change-generator.ts:53`).

Blocks `controller-generator-is-not-a-named-base`: Rails'
`create_controller_files` is `template "controller.rb", File.join("app/controllers", class_path, "#{file_name}_controller.rb")`
(`railties/lib/rails/generators/rails/controller/controller_generator.rb:13-15`),
and a `@missingRailsCall template` receipt was rejected in review of trails#8226.

## Acceptance criteria

- `Thor::Actions#template` ported into `packages/trailties/src/thor/actions.ts`
  with Rails' control flow: `destination = args.first || source.sub(/#{TEMPLATE_EXTNAME}$/, "")`,
  `find_in_source_paths`, render through the TSE compiler with the generator as
  context, then `create_file destination, nil, config`; an optional block post-processes the content.
- The migration generator's in-line render goes through it (or through the same helper
  `migration_template` calls), not a second copy.
- `TestUnit::Generators::ModelGenerator#create_test_file` and `#create_fixture_file`
  (`railties/lib/rails/generators/test_unit/model/model_generator.rb:15-17,21-25`) call
  `template "unit_test.rb", …` / `template "fixtures.yml", …`; trails'
  `packages/trailties/src/generators/test-unit/model/model-generator.ts` renders
  `TEMPLATES.*` through `createFile` under a `@missingRailsCall template — CONVERGEABLE`
  receipt citing this story. Both go through the ported `template` and the receipts
  are deleted; otherwise closing this story reds `stale-story-references`.

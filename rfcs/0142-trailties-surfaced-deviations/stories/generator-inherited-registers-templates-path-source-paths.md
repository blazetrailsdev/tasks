---
title: "Generators::Base.inherited source_paths registration from templates_path"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Generators::Base.inherited`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:242-256`) calls
`base.source_root` so `default_source_root` is cached. For a named generator
that isn't a `…Base`, it also pushes one entry per `Rails::Generators.templates_path`
onto `base.source_paths`: `File.join(path, base.base_name, base.generator_name)`
when the name is namespaced, `File.join(path, base.generator_name)` otherwise.
That is how an app's `lib/templates/active_record/migration/create_table_migration.rb.tt`
overrides the gem template. It is tested by `test_migration_source_paths`
(`railties/test/generators/model_generator_test.rb:40-53`) and
`test_source_paths_for_not_namespaced_generators` (`railties/test/generators_test.rb:252-255`).

trails#8269 ported `source_paths` / `source_root` / `find_in_source_paths`, but
not this registration. `Generators.templates_path` is not on main either
(`git grep templatesPath packages/trailties/src` is empty), and the
`templates_path.concat config.templates` step is owned by
`generators-configure-bang-api-only-no-color-fallbacks-templates`. JS has no
`inherited` hook (CLAUDE.md § "`inherited` is deferred to own-property memo
guards"), so the registration has to run lazily. The natural seat is
`ClassMethods.sourcePaths`' first own-property initialization in
`packages/trailties/src/thor/actions.ts`, or `GeneratorBase.sourcePathsForSearch`.

## Acceptance criteria

- A generator's `sourcePaths()` includes `File.join(path, baseName, generatorName)`
  (namespaced) or `File.join(path, generatorName)` for each
  `Generators.templatesPath()` entry, skipped for a class whose name ends in `Base`,
  as `base.rb:247-255` does.
- `it.skip("migration source paths")` in
  `packages/trailties/src/generators/model-generator.test.ts:67` is ported and
  passes: an app `lib/templates/active_record/migration/create_table_migration.ts.tt`
  overrides the gem template.
- `source paths for not namespaced generators` is ported.

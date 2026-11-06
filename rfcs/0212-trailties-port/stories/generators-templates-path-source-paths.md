---
title: "generators-templates-path-source-paths"
status: done
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9795
claim: "2026-11-06T18:17:05Z"
assignee: "generators-templates-path-source-paths"
blocked-by: null
closed-reason: null
---

## Context

`ModelGeneratorTest > migration source paths` (`vendor/rails/v8.0.2/railties/test/generators/model_generator_test.rb:40-54`) is still `it.skip` in `packages/trailties/src/generators/model-generator.test.ts`. It writes `lib/templates/active_record/migration/create_table_migration.rb.tt` under `Rails.root` and expects the generator to pick it up.

The machinery behind that isn't ported:

- `Rails::Generators.templates_path` plus `configure!`'s `templates_path.concat config.templates` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:68-82`).
- `Rails::Generators::Base.inherited` appending `File.join(path, base.base_name, base.generator_name)` to `source_paths` for each templates path (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:242-258`).
- The test helper's `Rails.application.config.generators.templates = [fixtures/lib/templates]` and `config.root = fixtures` (`vendor/rails/v8.0.2/railties/test/generators/generators_test_helper.rb:10-29`).

trails' `Application#ensureGeneratorTemplatesAdded` (`packages/trailties/src/application.ts`) fills `config.generators().templates`, but nothing reads it into a generator's source paths.

## Acceptance criteria

- `Generators.templatesPath` is ported, and `configureBang` concatenates `config.templates` into it.
- Generator source paths include `<templatesPath>/<baseName>/<generatorName>`, as `Base.inherited` does. Because `inherited` has no JS hook, apply the own-property deferral (CLAUDE.md, "`inherited` is deferred to own-property memo guards").
- "migration source paths" runs its Rails body.

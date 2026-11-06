---
title: "Generator namespaces are snake_case like Rails (test_unit:model), not dasherized"
status: draft
updated: 2026-11-06
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails derives a generator's namespace from its class through `Thor::Util.namespace_from_thor_class` (snake_case), then `Rails::Generators::Base.namespace` strips `_generator` and `:generators:` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:54-57`). So `TestUnit::Generators::ModelGenerator.namespace` is `"test_unit:model"`, and `Rails::Generators.find_by_namespace` matches lookups verbatim (`railties/lib/rails/generators.rb:234-256`).

trails dasherizes instead, in two places:

- `findByNamespace` maps every lookup through `dasherize(underscore(namespace))` (`packages/trailties/src/generators.ts`, the `lookups = lookups.map(...)` line).
- `requireGenerator` seats `klass.namespace(...)` from the dashed directory path.

So `namespace()` answers `"test-unit:model"`. The three tests `generators_test.rb:102-106,182-198` (`find by namespace with context`, `fallbacks for generators on find by namespace[ with context]`) assert the dashed value, receipted in `scripts/test-compare/assertion-receipts/trailties.ts` (trails#9789). The kebab-case spelling also feeds the help listing and the usage banner (`generators.trails.test.ts` "resolves a generator from either spelling", `base.trails.test.ts` "--help falls back to ... a kebab-case banner").

## Acceptance criteria

- `GeneratorBase.namespace()` answers Rails' snake_case namespace (`test_unit:model`, `trails:scaffold_controller`). `findByNamespace` drops its `dasherize` step and matches lookups as Rails does. `requireGenerator` seats the underscored path.
- The CLI keeps accepting the kebab spelling on the command line (RFC 0171 decision 6), converting at the command boundary rather than in `namespace()`.
- The three `generators_test.rb` receipts are deleted, and the tests assert `test_unit:model` / `test_unit:plugin`.

---
title: "port-test-unit-generators-model-and-plugin"
status: draft
updated: 2026-09-28
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

trails has no `TestUnit::Generators` at all. Rails ships them under
`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/`
(`model`, `plugin`, `controller`, `helper`, `integration`, `system`, `scaffold`, …).
Their namespaces are `test_unit:<name>`, derived from `TestUnit::Generators::<Name>Generator`
(`test_unit.rb`, `TestUnit::Generators::Base`).

trails#8228 (`port-generators-hook-for-and-app-generators-options`) ported
`Generators.findByNamespace(name, base, context)` with the `invoke_fallbacks_for` tail
(`railties/lib/rails/generators.rb:234-256,291-304`) and `GeneratorBase.hookFor`
(`generators/base.rb:174-202`). The `generators_test.rb` arms that exercise them
cannot be ported until a `test_unit:*` generator exists for `lookup` to load:

- `test_find_by_namespace_with_context` (`railties/test/generators_test.rb:102-106`)
  expects `find_by_namespace(:test_unit, nil, :model)` to be `test_unit:model`.
- `test_fallbacks_for_generators_on_find_by_namespace` / `..._with_context`
  (`generators_test.rb:182-198`) expect `test_unit:plugin`.

`Generators.lookup` (`packages/trailties/src/generators.ts`) looks only under
`generators/`. Generators are named `<dasherized path>-generator.ts`, so
`test_unit:model` would resolve to `generators/test-unit/model/model-generator.ts`.

## Acceptance criteria

- `TestUnit::Generators::Base` and at least the `model` and `plugin` generators are
  ported under `packages/trailties/src/generators/test-unit/`, and each one's namespace
  is `test_unit:<name>`.
- `generators.test.ts` ports `find by namespace with context`,
  `fallbacks for generators on find by namespace` and
  `fallbacks for generators on find by namespace with context` verbatim.

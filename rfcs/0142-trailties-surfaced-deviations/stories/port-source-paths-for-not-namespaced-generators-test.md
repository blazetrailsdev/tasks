---
title: "port-source-paths-for-not-namespaced-generators-test"
status: ready
updated: 2026-11-19
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

Remainder of `generator-inherited-registers-templates-path-source-paths`: the
registration itself landed in trails#9795 (`GeneratorBase.sourcePaths`,
`packages/trailties/lib/generators/base.ts:227-241`), and "migration source
paths" is ported (`packages/trailties/test/generators/model-generator.test.ts:81`).

`test_source_paths_for_not_namespaced_generators`
(`vendor/rails/v8.0.2/railties/test/generators_test.rb:252-255`) is not ported.
It needs Rails' fixture generator `fixjour`
(`vendor/rails/v8.0.2/railties/test/fixtures/lib/generators/fixjour_generator.rb`)
reachable by `Generators.findByNamespace("fixjour")` from the test app's
`lib/generators`.

## Acceptance criteria

- [ ] A `fixjour` fixture generator mirrors Rails' fixture, found through the lookup paths.
- [ ] `it("source paths for not namespaced generators")` in `packages/trailties/test/generators.test.ts` asserts `sourcePaths()` includes `File.join(Trails.root(), "lib", "templates", "fixjour")`.

---
title: "production-graph-lazy-require-edges"
status: in-progress
updated: 2026-11-05
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9742
claim: "2026-11-05T16:43:28Z"
assignee: "production-graph-lazy-require-edges"
blocked-by: null
closed-reason: null
---

## Context

`trailties-test-unit-is-on-the-production-boot-path` added a graph walk (`packages/trailties/src/production-boot.trails.test.ts`) from `index.ts`, `all.ts` and `server/index.ts`. Three edges into the AOT-forbidden set remain in its `KNOWN_EDGES`, each a lazy Rails `require` that a string-literal `import()` still puts into a Perry build:

- `engine.ts -> generators.ts`: `Engine#load_generators`'s `require "rails/generators"` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:476-477`).
- `source-annotation-extractor.ts -> typescript`: Prism/Ripper (`railties/lib/rails/source_annotation_extractor.rb:3-9`), required by `application/configuration.rb:9`.
- `trailties/action-view.ts -> @blazetrails/trails-tsc`: the dev-only `watchViews` server block (no Rails counterpart).

Needs an owner ruling on how a lazy Rails `require` is spelled so an AOT compiler does not follow it. Also: `examples/perry-native` is not in the tree, so the module-count measurement could not be taken.

## Acceptance criteria

- [ ] `KNOWN_EDGES` is empty and the graph test still passes.
- [ ] The Perry server-graph module count is measured before/after.

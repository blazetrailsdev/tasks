---
title: "Engine#loadGenerators imports generators.js by literal specifier so the playground can call it"
status: in-progress
updated: 2026-11-26
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10822
claim: "2026-11-26T22:34:25Z"
assignee: "generators-base-root-survives-a-bundle"
blocked-by: null
closed-reason: null
---

## Context

`Engine#loadGenerators` (`packages/trailties/lib/engine.ts:311-316`) runs `await import(generators)` with `const generators = "./generators.js"` (`engine.ts:52`). A bundler cannot follow a variable specifier, so in the browser playground (trails#10808) the import does not resolve, and `examples/browser-sqlite/src/runtime/generate.ts` imports `dist/generators.js` itself and runs `runGeneratorsBlocks` + `configureBang` by hand. Rails: `load_generators` is `require "rails/generators"; run_generators_blocks(app); Rails::Generators.configure!(app.config.generators)` (`vendor/rails/v8.0.5.2/railties/lib/rails/engine.rb:468-473`); the `require` is static.

Relatedly, `Base.baseRoot()` (`packages/trailties/lib/generators/base.ts:261-264`) and `command/behavior.ts:16-17` derive paths from `import.meta.url`, which in a bundle is a chunk URL; the playground re-seats templates under whatever `baseRoot()` answers.

## Acceptance criteria

- `loadGenerators` imports `./generators.js` with a literal specifier (it is in a function body, so a plain import does not create a load-order edge; root CLAUDE.md § "Call-time constant resolution"), so a bundle resolves it.
- The playground calls `Trails.application.loadGenerators()` instead of mirroring its body.
- `pnpm smoke` in `examples/browser-sqlite` still generates a model.

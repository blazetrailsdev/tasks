---
title: "trailties: Engine#loadGenerators requires generators without an invented specifier const"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Engine#load_generators` is `require "rails/generators"` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:476-481`). trails#10511 ported it as `await import(generators)` over a module-level `const generators = "./generators.js"` (`packages/trailties/lib/engine.ts:47-48,287`), receipted `@noRailsEquivalent PERMANENT`, so the literal specifier stays out of `test/production-boot.trails.test.ts`'s static scan. A `$LOAD_PATH` `rbFRequireFile("generators")` (the faithful shape: trailties' lib is already on `LOAD_PATH`, `lib/command/behavior.ts:14-15`) loaded a second module instance under vitest, because `loadIseqEval`'s `import(fileURL)` does not dedupe with vite's module ids, and that broke `test/commands/destroy.trails.test.ts`.

## Acceptance criteria

- [ ] `loadGenerators` requires the generators module through `rbFRequireFile` (or a `loadPath` table `rbFRequire` reads) with no invented specifier const.
- [ ] Under vitest, the module `rbFRequireFile`/`loadIseqEval` loads is the same instance a static import gets (fix the importer), so destroy.trails.test.ts stays green.
- [ ] production-boot.trails.test.ts stays green; the receipt on `generators` is deleted.

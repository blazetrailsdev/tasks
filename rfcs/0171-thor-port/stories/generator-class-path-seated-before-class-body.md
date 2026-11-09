---
title: "trailties: generator Ruby class paths are seated before their static blocks read rbModName"
status: in-progress
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: trails#9917
claim: "2026-11-09T14:50:23Z"
assignee: "generator-class-path-seated-before-class-body"
blocked-by: null
closed-reason: null
---

## Context

Ruby knows a class's `name` the moment `class Trails::Generators::AppGenerator` opens, so class-body calls that read it get the right answer. In trails, `rbModName` reads the generated `constants.*.generated.ts` table (e.g. `packages/trailties/lib/generators/trails/app/constants.trails-app-app-generator.generated.ts`: `[() => m0.AppGenerator, "Trails::Generators::AppGenerator"]`), and that table registers only after the class module has evaluated. Generator `static {}` blocks call `classOption` / `addSharedOptionsFor`, which reach `defaultForOption` (`packages/trailties/lib/generators/base.ts`) and so `baseName` / `generatorName`, before the path is seated. trails#9898 found this: memoizing `@base_name ||=` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:334-347`) cached the pre-seat name and broke the source-root lookup (`Could not find "README.md" in any of your source paths`). That blocks `generator-base-name-generator-name-memoize`.

## Acceptance criteria

- [ ] `rbModName(Klass)` answers the full Ruby path inside the class's own `static {}` blocks for trailties generators, the way Ruby's `name` does inside the class body.
- [ ] A test reads `rbModName(this)` from a generator's static block and gets `Trails::Generators::…`.
- [ ] `generator-base-name-generator-name-memoize` can then land with its memo and CI stays green.

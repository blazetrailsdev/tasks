---
title: "app-generator-version-control-runs-git-init"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
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

`packages/trailties/src/commands/new.ts` runs `git init` after `AppGenerator.start`, through a private `NewAppGenerator` that captures the instance. Rails does it inside the generator: `AppBuilder#version_control` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:96-100`), reached by `build(:version_control)` (`:365`). `gitInitCommand` is already ported in `packages/trailties/src/generators/app-base.ts`.

## Acceptance criteria

- `versionControl` is ported on `AppBuilder` and built from the generator's Rails position, using `gitInitCommand`.
- The `git init` step and its instance capture leave `new.ts`.

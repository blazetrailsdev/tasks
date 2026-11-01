---
title: "app-builder-version-control-runs-git-init"
status: closed
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
closed-reason: "FALSIFIED: duplicate of app-generator-version-control-runs-git-init"
---

## Context

`AppBuilder#version_control` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:96-100`)
is not on `AppBuilder` in `packages/trailties/src/generators/rails/app/app-generator.ts`, so
`build("versionControl")` no-ops and a generated app never gets `git init`, though
`gitInitCommand` is ported in `packages/trailties/src/generators/app-base.ts`.

## Acceptance criteria

- `AppBuilder#versionControl` runs `gitInitCommand` unless `skipGit` or `pretend`, as Rails does.
- A test asserts a generated app is a git repository, and that `skipGit` leaves none.

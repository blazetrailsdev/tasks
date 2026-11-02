---
title: "actions-generate-runs-in-line"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9640
claim: "2026-11-02T22:38:07Z"
assignee: "actions-generate-runs-in-line"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Actions#generate` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb`) runs the generator in line. `packages/trailties/src/generators/actions.ts:150` queues it on `pendingGenerators`, and `AppGenerator.applyRailsTemplate` (`generators/rails/app/app-generator.ts`) and `authentication-generator.ts:130` drain the queue afterwards.

## Acceptance criteria

- `generate` is awaited in line at its call site in a template or generator.
- `pendingGenerators` and both drain loops are deleted, with the `@inventedArm perform` receipt.

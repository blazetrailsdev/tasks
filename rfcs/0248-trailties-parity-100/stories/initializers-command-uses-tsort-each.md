---
title: "trailties: Initializable::Collection#tsort_each and InitializersCommand's call to it"
status: in-progress
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10528
claim: "2026-11-21T21:57:40Z"
assignee: "app-generator-css-tailwind-writes-tailwindcss-vite"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/commands/initializers.ts` iterates `Trails.application!.initializers.tsort()`, where Rails' `InitializersCommand#perform` calls `Rails.application.initializers.tsort_each` (`vendor/rails/v8.0.2/railties/lib/rails/commands/initializers/initializers_command.rb:14`). `Initializable::Collection` (`packages/trailties/lib/initializable.ts:71-99`) includes `TSort` in Rails (`vendor/rails/v8.0.2/railties/lib/rails/initializable.rb:36-50`) but the port has only `tsort`, `tsortEachNode` and `tsortEachChild`, so there is no `tsortEach`.

## Acceptance criteria

- [ ] `Collection` answers `tsortEach(block)`, the TSort method Rails' `Collection` gets by including `TSort`.
- [ ] `InitializersCommand#perform` calls `tsortEach` as Rails does.

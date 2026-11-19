---
title: "Engine#helpersPaths answers synchronously like Rails' helpers_paths"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Engine.isolate_namespace` defines `railtie_helpers_paths` as
`-> { railtie.helpers_paths }` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:410-412`), and
`Engine#helpers_paths` is a synchronous reader (`engine.rb:520-522`).

In trails `Engine#helpersPaths()` (`packages/trailties/lib/engine.ts`) returns a Promise, so
`mod.trailtieHelpersPaths()` answers a Promise. Its Rails consumer,
`ActionController::Railties::Helpers.inherited`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/railties/helpers.rb:12-19`), reads it
in line.

## Acceptance criteria

- `helpersPaths` answers synchronously, as `paths["app/helpers"].existent` does in Rails.
  The likely route is prewarming `existent` at boot.
- `trailtieHelpersPaths` answers an array, and the actionpack consumer reads it without an
  `await`.

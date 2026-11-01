---
title: "change-generator-includes-app-name"
status: done
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9577
claim: "2026-11-01T15:46:44Z"
assignee: "change-generator-includes-app-name"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb:12` has `include AppName`. `packages/trailties/src/generators/rails/db/system/change/change-generator.ts:37,52` holds an `appName` field instead of including `packages/trailties/src/generators/app-name.ts`.

## Acceptance criteria

- `ChangeGenerator` includes `AppName` and its `appName` field is removed.

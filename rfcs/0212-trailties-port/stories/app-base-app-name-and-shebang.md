---
title: "app-base-app-name-and-shebang"
status: draft
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

`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb` members still absent from `packages/trailties/src/generators/app-base.ts`: `add_shebang_option!` (:24), `include AppName` (:15), and the constructor's `@argv` / `@gem_filter` (:142-143). `AppGenerator` holds private `appName`, `appConst` and `isValidConst` stand-ins for `AppName`.

## Acceptance criteria

- `AppBase` includes a ported `AppName` and `AppGenerator`'s private stand-ins are removed.
- `add_shebang_option!` runs on `AppBase`.
- `@argv` is set as Rails sets it; `@gem_filter` is ported or moved with the Gemfile family to RFC 0171.

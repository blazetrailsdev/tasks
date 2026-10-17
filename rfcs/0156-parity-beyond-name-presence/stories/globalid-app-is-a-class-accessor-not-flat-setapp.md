---
title: "globalid-app-is-a-class-accessor-not-flat-setapp"
status: done
updated: 2026-10-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8998
claim: "2026-10-16T23:58:13Z"
assignee: "globalid-app-is-a-class-accessor-not-flat-setapp"
blocked-by: null
closed-reason: null
---

## Context

Rails seats the default app on the `GlobalID` class itself:
`class << self; attr_reader :app` and `def app=(app); @app = URI::GID.validate_app(app); end`
(`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:8-9,31-33`). Callers write
`GlobalID.app = "bcx"` and read `GlobalID.app`; `GlobalID.create` reads it via
`options.fetch(:app) { GlobalID.app }` (`global_id.rb:12`).

trails keeps it as a module-level variable in an invented file,
`packages/globalid/src/config.ts`, exported as flat `setApp()` / `getApp()`
functions (plus `_resetApp()`), re-exported from `index.ts`. `global-id.ts:69`
reads `opts.app ?? getApp()` (a `??` where Rails has `fetch`), and the
ArgumentError message at `global-id.ts:72` adds "via setApp()" to Rails' text.
Consumers: `global-id.ts`, `fixture-set.ts`, actionview `asset-tag-helper.ts`,
activerecord, and the activejob test helper (`GlobalID.app = "aj"`,
`vendor/rails/v8.0.2/activejob/test/helper.rb`). Surfaced by the Ruby→TS
codegen spike, which has to special-case `GlobalID.app=` to the flat `setApp`.

## Acceptance criteria

- `GlobalID` has a static `app` reader and a static `setApp(app)` writer (the
  `x=` → `setX` spelling) holding `URI::GID.validateApp(app)`, in `global-id.ts`.
- `config.ts`, `getApp`, the flat `setApp` and `_resetApp` are removed; every
  caller uses `GlobalID.app` / `GlobalID.setApp`.
- `GlobalID.create` reads the option with `fetch` semantics and raises Rails'
  exact message ("… set the default GlobalID.app.").
- globalid tests pass; parity:api:extra for globalid does not grow.

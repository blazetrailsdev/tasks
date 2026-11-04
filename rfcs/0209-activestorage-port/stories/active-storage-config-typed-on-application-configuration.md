---
title: "config.activeStorage types on the application's Configuration"
status: done
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9709
claim: "2026-11-04T14:08:12Z"
assignee: "rackup-stream-reader-receipts-at-declaration"
blocked-by: null
closed-reason: null
---

## Context

`packages/activestorage/src/engine.ts:69-73` augments `@blazetrails/trailties/trailtie/configuration`'s `Configuration` with `activeStorage`. The application's `config` doesn't pick it up. `engine.ts`'s `active_storage.services` initializer reads `(TopLevel.Trails!.configuration as unknown as { activeStorage: ActiveStorageConfig }).activeStorage`, and so does trails#9692's `packages/trailties/src/all.trails.test.ts`. Rails reads `Rails.configuration.active_storage` directly (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:139-148`).

## Acceptance criteria

- `app.config.activeStorage` and `Trails.configuration.activeStorage` type-check once `@blazetrails/trailties/all` (or the engine) is imported.
- The `as unknown as { activeStorage: … }` casts in `engine.ts` and `all.trails.test.ts` are removed.

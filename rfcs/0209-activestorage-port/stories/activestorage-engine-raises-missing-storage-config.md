---
title: "Engine services hook raises on missing storage config (Blob loaded lazily)"
status: done
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9678
claim: "2026-11-03T18:02:01Z"
assignee: "activestorage-engine-raises-missing-storage-config"
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Engine`'s `active_storage.services` initializer
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:139-156`)
raises `"Couldn't find Active Storage configuration in #{config_file}"` (`:146`)
inside `on_load(:active_storage_blob)`. Rails autoloads `ActiveStorage::Blob`,
so the raise fires only when an app first references `Blob`.

trails#9663 ported the initializer, but in `packages/activestorage/src/engine.ts`
the hook returns without registering services when neither
`config/storage/<env>.ts` nor `config/storage.ts` exists. The reason:
`blob.ts` is loaded at boot through ESM imports (`attached/model.ts:22`, the
previewers and the analyzers), so `runLoadHooks("active_storage_blob")`
(`blob.ts:577`) fires during the initializer. With the raise kept, every app
without a storage config fails to boot, including `trailties/src/all.trails.test.ts`.
The arm is receipted `@inventedArm if — PERMANENT` on `Engine` after an owner
dashboard answer, which was not recorded on the PR.

## Acceptance criteria

- `blob.ts` is no longer imported at module evaluation on the engine's boot path
  (`attached/model.ts`, the previewers, the analyzers), so `active_storage_blob`
  fires on Blob's first load, as Rails' autoload does. The likely shape is a
  call-time read through the `ActiveStorage.Blob` autoload seat.
- The services hook raises `RuntimeError` "Couldn't find Active Storage
  configuration in <path>" as `engine.rb:146` does, and the `@inventedArm if`
  receipt on `Engine` is removed.
- The trailties boot-app tests and `all.trails.test.ts` still boot without a
  storage config.

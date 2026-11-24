---
title: "activestorage: importing the package index evaluates blob.ts and fires active_storage_blob"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps:
  - framework-class-load-hooks-fire-after-app-initializers
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-24T02:59:56Z"
assignee: "activestorage-index-import-loads-blob-eagerly"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/activestorage/lib/active_storage/engine.rb` `active_storage.services` registers
`ActiveSupport.on_load(:active_storage_blob)`, which raises "Couldn't find Active Storage configuration" when
`config/storage.yml` is missing. In Rails the hook only fires when `ActiveStorage::Blob` is autoloaded, so an app that
never touches a blob (`railties/test/isolation/abstract_unit.rb:260-285` `make_basic_app`) never raises.

In trails `packages/activestorage/lib/blob.ts:582` runs `runLoadHooks("active_storage_blob")` at module evaluation, so
any process that imports the engine raises at boot for an app with no `config/storage.ts`
(`packages/activestorage/lib/engine.ts:222-239`). `packages/trailties/test/application/configuration.test.ts`
(trails#10599) works around it by seeding `ActiveStorageEngine.config.activeStorage.serviceConfigurations ??= {}`
in a local `makeBasicApp` wrapper — test setup with no Rails counterpart.

trails#9678 (`activestorage-engine-raises-missing-storage-config`) took `blob.ts` off the engine's boot path, but importing the package index (`@blazetrails/activestorage`, as `configuration.test.ts` does) still evaluates `blob.ts` and fires the hook.

Same eager-ES-import class as `trailties-action-controller-load-hooks-run-after-app-initializers`.

## Acceptance criteria

- [ ] Importing `@blazetrails/activestorage` does not evaluate `blob.ts` (or does not run `active_storage_blob` hooks) until `ActiveStorage.Blob` is first read.
- [ ] Booting an app with no storage config does not raise until a blob is used, as in Rails.
- [ ] The `serviceConfigurations ??= {}` seed in `configuration.test.ts` is removed and the `makeBasicApp` tests still pass.

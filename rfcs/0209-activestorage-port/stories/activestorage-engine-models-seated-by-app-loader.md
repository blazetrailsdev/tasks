---
title: "activestorage-engine-models-seated-by-app-loader"
status: ready
updated: 2026-11-03
rfc: "0209-activestorage-port"
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

Rails loads `ActiveStorage::Blob` from the engine's `app/models` through Zeitwerk, so the first
reference (`validate_global_service_configuration`'s `ActiveStorage::Blob.table_exists?`, in
`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/model.rb`) autoloads it, and
`engine.rb:140` `on_load(:active_storage_blob)` fires then. trails#9678 took `blob.ts` off the
engine's boot path. `attached/model.ts` (`validateServiceConfiguration`,
`validateGlobalServiceConfiguration`), `attached/changes/{create-one,create-many,delete-many}.ts`,
`fixture-set.ts` and `mirror-job.ts` now read `ActiveStorage.Blob!` at call time. No loader seats it
unless the app imports `@blazetrails/activestorage`, so an app whose connected model calls
`hasOneAttached` without that import gets a TypeError.

## Acceptance criteria

- The application loader seats the engine's models (Blob, Attachment, VariantRecord) as Zeitwerk
  does for an engine's `app/models` (awaited at boot, as § "`Module#autoload` is a build step"
  settles), so `ActiveStorage.Blob` resolves before app models are defined.
- Booting the engine with no storage config raises "Couldn't find Active Storage configuration", as Rails does under `eager_load = true` (`engine.rb:140-146`): the trails app loader always eager-loads at boot, so Blob loads then. Operator ruling on trails#9684.

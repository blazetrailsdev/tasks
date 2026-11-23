---
title: "Load cloud service files from the configs on_load reads, not an initializer snapshot"
status: done
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10633
claim: "2026-11-23T09:42:28Z"
assignee: "activestorage-engine-service-load-reads-lazy-configs"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/activestorage/lib/active_storage/engine.rb:152-169` reads
`Rails.configuration.active_storage.service_configurations` lazily inside
`ActiveSupport.on_load(:active_storage_blob)`. trails#10614 made the
`active_storage.services` initializer (`packages/activestorage/lib/engine.ts`)
`await Configurator.load(...)` on a snapshot taken when the initializer runs
(`serviceConfigurations ?? mod?.default ?? {}`), before the `onLoad` block runs.
Configs assigned between the initializer and the Blob load are never loaded, so
`Configurator#resolve` raises a spurious `Missing service adapter` for them.

## Acceptance criteria

- [ ] The configs `Configurator.load` sees are the ones the `on_load` block reads
      (e.g. `Registry#fetch` / `Configurator#build` awaits a pending load, or the
      `||=` assignment is hoisted so both read one value), with no new snapshot
- [ ] A test assigns `serviceConfigurations` after the initializer, before the
      Blob load, and resolves an S3/GCS service

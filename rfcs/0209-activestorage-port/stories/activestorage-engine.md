---
title: "Port ActiveStorage::Engine"
status: draft
updated: 2026-10-28
rfc: "0209-activestorage-port"
cluster: as-engine
packages: ["activestorage"]
deps:
  [
    "activestorage-service-registry-and-configurator",
    "activestorage-reflection-and-validations",
    "activestorage-routes-and-controller-concerns",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb` (205) is a `Rails::Engine`
(`packages/trailties/src/engine.ts`; `packages/solid-queue/src/engine.ts` is
the precedent): `config.active_storage` defaults (`:27-80`), initializers
`active_storage.deprecator`, `.configs` (`:86-123`), `.attached` (on_load
`:active_record`, include `Attached::Model`, `:125-131`), `.verifier`,
`.services` (`storage.yml` through `Service::Registry`, `:139-156`), `.queues`,
`.reflection`, `action_view.configuration`, `.asset`, `.fixture_set`
(`:191-203`). The trailties `load_defaults` arms that set
`activeStorage.queues` / `trackVariants`
(`packages/trailties/src/application/configuration.ts:201-246`) start
reaching a real config. Test: `test/engine_test.rb` (3).

## Acceptance criteria

- The engine and every initializer are ported in Rails' order, with
  on-load hooks through activesupport's `onLoad`.
- `config.active_storage.service` loads `config/storage.yml` into the
  registry; a cloud service name raises "Missing service adapter for …".
- `engine_test.rb` passes.

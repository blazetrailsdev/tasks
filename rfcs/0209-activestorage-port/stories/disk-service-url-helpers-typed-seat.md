---
title: "DiskService url_helpers reads a typed routes seat; tests use engine routes"
status: ready
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DiskService#url_helpers` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/disk_service.rb:170-172`)
is `@url_helpers ||= Rails.application.routes.url_helpers`. The port
(`packages/activestorage/src/service/disk-service.ts`, `urlHelpers()`) reads
`TopLevel.Trails!.application!.routes()` and casts it `as unknown as RouteSet`, then
casts `urlHelpers()` to a string-keyed record. The cast is needed because the
`TopLevel.Trails.application.routes()` seat type
(`packages/activesupport/src/namespaces.ts:58-80`) declares only `namedRoutes`.
The disk service tests (`packages/activestorage/src/service/shared-service-tests.ts`)
also draw the two `rails_disk_service` routes (`activestorage/config/routes.rb:13-14`)
themselves and set a stub `TopLevel.Trails`, waiting on
`activestorage-routes-and-controller-concerns`.

## Acceptance criteria

The engine-routes half moved to `shared-service-tests-use-engine-routes`.

- The `routes()` seat type declares `urlHelpers()`, so `DiskService#urlHelpers` reads it
  without `as unknown as`.

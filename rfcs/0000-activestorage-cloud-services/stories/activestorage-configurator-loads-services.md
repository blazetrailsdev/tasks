---
title: "Configurator awaits a service file's load and resolves it with constGet"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`resolve` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/configurator.rb:29-34`) requires the service file and
`const_get`s the class. `packages/activestorage/src/service/configurator.ts`
still has RFC 0209's module-private `services` table, which RFC 0213's reversal
retires. See the RFC, § "Configurator: the registry retires".

## Acceptance criteria

- [ ] `Configurator.load(configurations)` awaits the import of each configured
      service file, carrying `@noRailsEquivalent PERMANENT`
- [ ] A missing module is held and raised by `resolve` as
      `Missing service adapter for "Foo"`; any other import error propagates
- [ ] `resolve` is `constGet` on `Service`, and the `services` table is gone
- [ ] `DiskService` and `MirrorService` are seated on `Service` with plain
      assignments, and `Mirror`'s `primary` and `mirrors` are loaded by the same step
- [ ] `"GCS"` resolves `gcs-service.js` and `GCSService`; `"AzureStorage"` raises
      the missing-adapter error
- [ ] Open question 3 is settled and recorded in the RFC
- [ ] `vendor/rails/v8.0.2/activestorage/test/service/configurator_test.rb` still passes

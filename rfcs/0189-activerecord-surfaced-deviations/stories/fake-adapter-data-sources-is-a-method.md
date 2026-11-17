---
title: "FakeActiveRecordAdapter#data_sources answers as a method so SchemaCache can read it"
status: draft
updated: 2026-11-17
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/test/support/fake-adapter.ts` declares `dataSources: string[]` as a property (Ruby `attr_accessor :data_sources`, `vendor/rails/v8.0.2/activerecord/test/support/fake_adapter.rb`). `SchemaCache#tablesToCache` (`packages/activerecord/lib/connection-adapters/schema-cache.ts:~565`) calls `connection.dataSources()` as Rails' `tables_to_cache` calls `connection.data_sources`. On a fake connection that throws `TypeError: connection.dataSources is not a function`, so `Contact.loadSchema()` cannot warm through `dataSourceExists`. trails#10224 worked around it by warming via `schemaCache.columnsHash`.

## Acceptance criteria

- [ ] The fake adapter answers `dataSources()` as a method (a Ruby attr_accessor reader is a call), with a writer for the test setup, so `schemaCache.dataSourceExists` works on it.
- [ ] `Contact` / `ContactSti` warm through `loadSchema()`, and the `@ts-expect-error` on `dataSources` is gone.

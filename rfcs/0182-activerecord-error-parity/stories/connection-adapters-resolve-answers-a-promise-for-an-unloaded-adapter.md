---
title: "ConnectionAdapters.resolve answers a Promise for an unloaded adapter"
status: in-progress
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8612
claim: "2026-10-07T02:03:10Z"
assignee: "connection-adapters-resolve-answers-a-promise-for-an-unloaded-adapter"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::ConnectionAdapters.resolve`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:26-66`)
`require`s the adapter file in line and returns the class. trails' `resolve`
(`packages/activerecord/src/connection-adapters.ts`) loads the adapter with a
dynamic `import()`, so for an adapter whose module is not loaded yet it returns
`Promise<AdapterClass>`; its return type is `AdapterClass | Promise<AdapterClass>`.

`DatabaseConfig#adapter_class`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/database_config.rb:16-18`)
is `@adapter_class ||= ActiveRecord::ConnectionAdapters.resolve(adapter)`. The
port (`packages/activerecord/src/database-configurations/database-config.ts`,
`adapterClass`) keeps that body and casts the union away, so a config read
synchronously before `validateBang` has loaded the adapter memoizes the
Promise. `validateBang` awaits `ConnectionAdapters.resolve(this.adapter)`
directly and seats the class, where Rails' `validate!` (`:28-32`) calls
`adapter_class`; it carries
`@missingRailsCall adapter_class — CONVERGEABLE connection-adapters-resolve-answers-a-promise-for-an-unloaded-adapter`.

Every pool goes through `validateBang` first
(`connection-adapters/abstract/connection-handler.ts`, `resolvePoolConfig`), so
the Promise is only reachable on a config nothing has validated.

## Acceptance criteria

- [ ] `resolve` returns the adapter class and never a Promise; the dynamic
      import is awaited at one named site that runs before any synchronous
      reader.
- [ ] `adapterClass` drops its cast, and `validateBang` calls `adapterClass`
      as `database_config.rb:28-32` does; the `@missingRailsCall` receipt is
      deleted.
- [ ] A synchronous `adapterClass()` on a config whose adapter is not loaded
      raises rather than answering a Promise, and the message is Rails'
      `Could not load the … Active Record adapter` (`connection_adapters.rb:60-64`).

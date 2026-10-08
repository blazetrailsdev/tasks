---
title: "activerecord: Mysql2Adapter drops the invented _fakeConnection config key"
status: draft
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8683.

`Mysql2Adapter` reads an invented config key, `_fakeConnection` (`packages/activerecord/src/connection-adapters/pool-config.ts`, `MysqlAdapterOptions._fakeConnection`). `_ensureClient` in `packages/activerecord/src/connection-adapters/mysql2-adapter.ts` raises `RuntimeError("Mysql2Adapter: fake connection has no client")` when it is set, and `newClient` strips it before handing the config to the driver.

Rails has no such key. `Mysql2Adapter#connect` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:146-150`) is `@raw_connection = self.class.new_client(@connection_parameters)` with no guard, and Rails' tests that want an adapter with no server build one from a config hash and never connect it, or stub `new_client`.

About ten trails tests pass `_fakeConnection: true` (`adapters/mysql2/mysql2-adapter.test.ts`, `adapters/mysql2/mysql2-adapter.trails.test.ts`, `connection-adapters/raw-connection-overload.trails.test.ts`, `connection-adapters/adapter-socket-key.trails.test.ts`, `connection-adapters/adapter-username-key.trails.test.ts`, `connection-adapters/mysql2-adapter.internal-execute-cast-result.trails.test.ts`).

## Acceptance criteria

- [ ] `_fakeConnection` is deleted from `MysqlAdapterOptions`, from `_ensureClient` and from `newClient`'s dropped keys.
- [ ] Tests that relied on it build the adapter from a plain config hash and either never connect or stub `Mysql2Adapter.newClient`, as the Rails test they mirror does.

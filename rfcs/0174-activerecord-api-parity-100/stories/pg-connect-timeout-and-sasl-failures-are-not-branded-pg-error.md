---
title: "activerecord: node-pg connect timeout and SASL failures are not PG::Error, so new_client lets them through"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

Surfaced by trails#8751, which made `PostgreSQLAdapter.newClient` rescue `PG.Error` only, as Rails' `rescue ::PG::Error` does
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:57-71`).

`PG.Error` is the brand `pgError` sets (`packages/activerecord/src/pg/exceptions.ts`): a pg-protocol `DatabaseError`, a
connection-level failure matched by message or an `08…` code, a coded socket error (`E…` / `EAI_…`), or `Query read timeout`.
node-pg raises two more connect failures as bare `Error`s with no `code` and no `name`, and neither is in that list:

- the connect timeout, message `timeout expired` (`pg/lib/client.js`, `connectionTimeoutMillis`);
- SASL failures, messages starting `SASL` (`pg/lib/crypto/sasl.js`).

`PG.connect` raises both as `PG::ConnectionBad`, so Rails turns them into `ActiveRecord::ConnectionNotEstablished`. In trails
they now propagate from `newClient` untranslated. `pgConnection` (`pg/connection.ts`) wraps `connect` with the same stamp it
puts on `query`, so the brand is the only thing missing.

## Acceptance criteria

- [ ] A connect timeout and a SASL failure raised by `client.connect()` are `PG.Error` (and `PG.ConnectionBad`, as libpq's are),
      so `newClient` raises `ConnectionNotEstablished` for them.
- [ ] A test fakes each rejection at `pg.Client.prototype.connect` and asserts the translated class.
- [ ] No arm is added that brands an arbitrary bare `Error`.

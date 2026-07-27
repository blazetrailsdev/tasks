---
title: "buildAdapterArg forwards unknown config keys to the mysql2 driver"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`buildAdapterArg` (`packages/activerecord/src/connection-adapters/adapter-args.ts:134-224`)
whitelists keys for the sqlite branch — "Keep only the SQLite3Adapter
constructor's `options` keys so we don't forward unrelated database.yml entries"
— but the PG/MySQL branch spreads the entire configuration hash into the driver
options object.

mysql2 rejects what it does not recognise with:

````text
Ignoring invalid configuration option passed to Connection: collation. This is
currently a warning, but in future versions of MySQL2, an error will be thrown
```text

Verified locally against mysql2 at the pinned version: `collation`,
`variables` and `preparedStatements` all warn, and the connection still opens.
`preparedStatements` has been reaching the driver this way for as long as the
`arunit_without_prepared_statements` entry has existed; #5397 adds `collation`,
`encoding` and `variables` because `config.example.yml:3-40` declares them, so
the noise grows on the mysql lane.

The config hash is the Rails port surface and should keep Rails' keys — the fix
belongs at the adapter boundary, not in the config.

## Acceptance criteria

- The MySQL branch of `buildAdapterArg` forwards only keys `Mysql2Adapter` /
  the mysql2 driver accept, as the sqlite branch already does.
- Rails keys that map to driver-native names keep their existing mapping
  (`username` → `user`, `socket` → `socketPath` inside the adapter constructor).
- Keys that are Rails config but not driver options (`collation`, `encoding`,
  `variables`, `preparedStatements`, `minMessages`) reach the adapter, not the
  driver — `preparedStatements` in particular is real adapter state
  (`abstract-adapter.ts:1003-1010`).
- A mysql-lane run logs no "Ignoring invalid configuration option" warnings.
````

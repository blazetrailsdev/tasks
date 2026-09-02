---
title: "adapterNameFromConfig resolves non-Rails adapter aliases Rails never registers"
status: draft
updated: 2026-09-02
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Type.adapter_name_from` is
`model.connection_db_config.adapter.to_sym`
(`vendor/rails/activerecord/lib/active_record/type.rb:49-51`) — the configured
adapter name verbatim, with no normalization and no alias arm. Rails registers
exactly four adapter names
(`vendor/rails/activerecord/lib/active_record/connection_adapters.rb:67-70`):
`sqlite3`, `mysql2`, `trilogy`, `postgresql`.

PR #7391 converged trails' canonical type-registry keys onto those Rails
spellings, but `adapterNameFromConfig`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`) still
carries an alias arm that resolves non-Rails spellings onto them:

- `postgres`, `pg` -> `postgresql`
- `mysql`, `mariadb` -> `mysql2`
- `sqlite`, `node-sqlite`, `expo-sqlite`, `libsql`, `libsql-remote`,
  `libsql-replica` -> `sqlite3`

That arm is not a Rails behaviour. It exists only because trails registers
non-Rails alias names beside the Rails ones at
`packages/activerecord/src/connection-adapters.ts:109-111`
(`register("sqlite", ...)`, `register("mysql", ...)`,
`register("postgres", ...)`). Without the alias arm a config written
`adapter: "postgres"` would load the PG adapter but key its type registrations
under `"postgres"`, matching none of the `{ adapter: "postgresql" }`
registrations — so the arm is currently load-bearing, and the registrations are
the thing to remove.

## Converged shape

- Delete the three alias registrations at `connection-adapters.ts:109-111`, so
  the registry holds only names Rails registers plus trails' genuinely distinct
  adapters.
- Delete the alias arm, leaving `adapterNameFromConfig` as identity over the
  registered names plus the `AdapterNotFound` default that already mirrors
  `connection_adapters.rb:34-39`.
- Decide the trails-only SQLite drivers (`node-sqlite`, `expo-sqlite`,
  `libsql`, `libsql-remote`, `libsql-replica`) deliberately: they are real
  registered adapters, and `SQLite3Adapter#typeRegistryKey` already pins them
  to `"sqlite3"` (`sqlite3-adapter.ts:159-161`), so they never reach
  `adapterNameFromConfig` through a live adapter — only through the
  no-adapter-yet path in `Type.adapterNameFrom` (`type.ts`).

## Acceptance criteria

- `adapterNameFromConfig` has no alias arm; a name Rails does not register
  raises `AdapterNotFound`.
- No `register(...)` call in `connection-adapters.ts` uses a non-Rails spelling
  of a Rails adapter.
- Existing adapter-specific type-registration tests still pass on all three
  adapters.

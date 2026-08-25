---
title: "buildAdapterArg has no Rails counterpart: new_connection should pass configuration_hash straight to the constructor"
status: draft
updated: 2026-08-21
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring `PoolConfig#adapterFactory` in PR #6826. That PR routed
**every** pool's connection construction through `db_config.new_connection`, as
Rails does — which puts `buildAdapterArg` on the hot path for every connection
in the codebase rather than only the by-name fallback.

Rails has no counterpart to `buildAdapterArg` at all. `new_connection` is one
line:

    # vendor/rails/activerecord/lib/active_record/database_configurations/database_config.rb:25-27
    def new_connection
      adapter_class.new(configuration_hash)
    end

The configuration hash goes to the constructor verbatim, because every Rails
adapter's `initialize` takes exactly that one hash
(`sqlite3_adapter.rb:102` `def initialize(...)` -> `super` ->
`AbstractAdapter#initialize(config)`).

trails needs `packages/activerecord/src/connection-adapters/adapter-args.ts`
(`buildAdapterArg`, :134-227) only because its adapter constructors are not
uniform: the SQLite branch returns the positional pair `[filename, options]` to
feed `SQLite3Adapter`'s `@deprecated` positional overload, while PG/MySQL get a
single hash. The file's own header says as much — "Rails passes
`configuration_hash` directly because its adapter constructors uniformly accept
a hash; trails' don't (yet)."

So `buildAdapterArg` is a bridge whose far bank is
[[retire-sqlite3-positional-constructor-overload]]. Once that lands and the
SQLite constructor takes only a config hash, `buildAdapterArg` has nothing left
to normalize and the whole module can be deleted, with
`DatabaseConfig#newConnection` becoming Rails' one-liner.

## Converged shape

- `DatabaseConfig#newConnection` is `new (await this.adapterClass())(this.configuration)`
  — the trails spelling of `adapter_class.new(configuration_hash)`, with no
  argument reshaping in between.
- `connection-adapters/adapter-args.ts`'s `buildAdapterArg` is deleted, along
  with its per-adapter key whitelist (see
  [[sqlite-adapter-arg-whitelist-drops-config-keys-rails-passes]]) and the
  `host = "localhost"` defaulting Rails leaves to the drivers.
- `normalizeAdapterName` / `parseSqliteUrl` / `adapterNameFromUrl` survive only
  if a caller outside `buildAdapterArg` still needs them; each is checked, not
  assumed.

## Sequencing

Depends on `retire-sqlite3-positional-constructor-overload`, which RFC 0094
sequences last within itself. This story lands after it.

## Acceptance criteria

- [ ] `buildAdapterArg` and its call sites are gone; `DatabaseConfig#newConnection`
      passes `configuration` straight to the adapter constructor.
- [ ] No config key reaches an adapter differently than it would in Rails.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

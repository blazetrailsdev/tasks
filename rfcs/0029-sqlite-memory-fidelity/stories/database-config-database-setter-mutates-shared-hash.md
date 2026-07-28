---
title: "database-config-database-setter-mutates-shared-hash"
status: ready
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseConfig#_database=` (`packages/activerecord/src/database-configurations/database-config.ts:127`)
writes through to the shared configuration hash:

```ts
set _database(database: string) {
  (this.configuration as Record<string, unknown>).database = database;
}
```

`DatabaseConfig`'s constructor stores `configuration` **by reference**
(`database-config.ts:80`), so this mutates the caller's original hash — the one
that came from the user's database config literal.

Rails replaces the hash instead of mutating it
(`vendor/rails/activerecord/lib/active_record/database_configurations/hash_config.rb:68`):

```ruby
def _database=(database)
  @configuration_hash = configuration_hash.merge(database: database).freeze
end
```

A new frozen hash, so the caller's input is untouched — and config identity is
preserved either way, since the `HashConfig` object itself is unchanged.

Surfaced in review of PR #5507, which removed the only in-tree caller of the
setter; the divergence is currently latent (no caller) but will bite the first
one.

## Acceptance criteria

- [ ] `_database=` merges into a NEW configuration hash rather than mutating
      the existing one, mirroring `hash_config.rb:68`.
- [ ] The `configuration` field is no longer `readonly` in a way that forces
      the write-through, and the object identity of the `DatabaseConfig` is
      unchanged by the setter (the `ConnectionHandler` reuse check depends on
      it — `connection-handler.ts:147`).
- [ ] A test asserts that setting `_database` leaves the hash originally passed
      to the constructor unmodified.

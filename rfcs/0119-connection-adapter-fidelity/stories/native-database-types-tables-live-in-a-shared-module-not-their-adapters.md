---
title: "NATIVE_DATABASE_TYPES tables live in a shared module and alias a by-adapter map with no Rails counterpart"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7546, which converged
`PostgreSQLAdapter.native_database_types` onto the Rails shape
(`postgresql_adapter.rb:404-410`) and made the class constant mutable, the way
Rails' own test does:

```ruby
# activerecord/test/cases/adapters/postgresql/timestamp_test.rb:198,206
ActiveRecord::ConnectionAdapters::PostgreSQLAdapter::NATIVE_DATABASE_TYPES[:datetimes_as_enum] = { name: "custom_time_format" }
...
ActiveRecord::ConnectionAdapters::PostgreSQLAdapter::NATIVE_DATABASE_TYPES.delete(:datetimes_as_enum)
```

In Rails there is exactly one such table per adapter, declared as a constant in
the adapter's own file (`postgresql_adapter.rb:134`, `sqlite3_adapter.rb`,
`abstract_mysql_adapter.rb`). trails keeps all three in a shared module,
`packages/activerecord/src/connection-adapters/abstract/native-database-types.ts`,
and additionally exposes them through a trails-only lookup with no Rails
counterpart:

```ts
export const NATIVE_DATABASE_TYPES_BY_ADAPTER: Record<AdapterName, NativeDatabaseTypes> = {
  sqlite3: SQLITE3_NATIVE_DATABASE_TYPES,
  postgresql: POSTGRESQL_NATIVE_DATABASE_TYPES,
  mysql2: MYSQL_NATIVE_DATABASE_TYPES,
};
```

`PostgreSQLAdapter.NATIVE_DATABASE_TYPES` aliases the same object as that map's
`postgresql` entry, so a mutation of the class constant is visible through
`NATIVE_DATABASE_TYPES_BY_ADAPTER` too. That is latent today because the only
mutator is the `withNativeDatabaseTypeOverrides` test helper, which restores on
exit — but Rails' documented extension point is exactly this mutation
(`postgresql_adapter.rb:117-119` tells users to add a key to the constant), so
the aliasing is a real hazard rather than a theoretical one.

## Converged shape

Each adapter's `NATIVE_DATABASE_TYPES` is a constant in that adapter's own
file, as in Rails, rather than a shared module re-exported through a
by-adapter map. `NATIVE_DATABASE_TYPES_BY_ADAPTER` has no Rails counterpart and
goes with it; its consumers
(`connection-adapters/schema-cache.test.ts`,
`connection-adapters/abstract/schema-statements-privates.trails.test.ts`)
read the constant off the adapter class they already have.

Watch for an import cycle when moving the PG table into
`postgresql-adapter.ts` — the abstract module is imported by
`abstract-mysql-adapter.ts` and `sqlite3-adapter.ts` as well.

## Acceptance criteria

- [ ] `NATIVE_DATABASE_TYPES` for each adapter is declared in that adapter's
      file, matching `postgresql_adapter.rb:134` et al.
- [ ] `NATIVE_DATABASE_TYPES_BY_ADAPTER` is deleted; no object is shared
      between an adapter's class constant and another structure.
- [ ] `pnpm parity:api:extra --package activerecord` novel count does not rise.
- [ ] All three adapter lanes stay green.

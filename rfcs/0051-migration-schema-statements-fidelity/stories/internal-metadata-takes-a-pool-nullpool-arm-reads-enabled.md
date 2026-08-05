---
title: "InternalMetadata takes an adapter where Rails takes a pool, so the NullPool arm reads as enabled"
status: blocked
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-05T13:14:58Z"
assignee: "date-initialize-guess-style-fast-path"
blocked-by: "Blocked on giving the ~30 InternalMetadata construction sites a real pool first. Confirmed on branch date-initialize-guess-style-fast-path-d501 by doing the conversion: AbstractAdapter#pool is declared `pool: unknown` (connection-adapters/abstract-adapter.ts:852) and planted as a NullPool at :808 (abstract_adapter.rb:153), so (a) every one of the ~30 `new InternalMetadata(adapter)` sites needs a `as ConnectionPool` cast or a pool-typing change that is its own story, and (b) once `enabled` is the faithful `@pool.db_config.use_metadata_table?` (internal_metadata.rb:35-36) with no softening, every NullPool-backed site — migrator.trails.test.ts, migration.test.ts, support/canonical-schema-stamp.ts, schema.ts Schema.define, tasks/database-tasks.ts, trailties db.ts — reads NULL_CONFIG (connection-pool.ts:62,155) and silently disables metadata storage suite-wide. The prerequisite is migration-context-collaborators-need-a-pool; this story should be re-scheduled after it."
closed-reason: null
---

## Context

`ActiveRecord::InternalMetadata` is constructed from a **pool**
(`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:20-22`):

```ruby
def initialize(pool)
  @pool = pool
  @arel_table = Arel::Table.new(table_name)
end
```

and `enabled?` (`:35-36`) reads straight off it:

```ruby
def enabled?
  @pool.db_config.use_metadata_table?
end
```

PR #6122 converged the _source_ of the flag — trails no longer requires an
explicit `{ enabled }` constructor option, and
`InternalMetadata#enabled` (`packages/activerecord/src/internal-metadata.ts`)
now reads `adapter.pool.dbConfig.useMetadataTable`. One arm stays divergent and
is cited at the getter:

- A `NullPool` answers `NULL_CONFIG`
  (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:62`,
  `:155`), whose every key is undefined — the analogue of Rails'
  `NullConfig#method_missing` returning nil
  (`connection_adapters/abstract/connection_pool.rb:17-22`). Rails would
  therefore read a NullPool-backed `InternalMetadata` as **disabled**.
- trails reads it as **enabled**, because `AbstractAdapter#initialize` plants a
  `NullPool` (`connection-adapters/abstract-adapter.ts:801`, mirroring
  `abstract_adapter.rb:153`) and trails builds `InternalMetadata` over bare,
  NullPool-backed adapters throughout — `migrator.trails.test.ts`,
  `migration.test.ts`, `support/canonical-schema-stamp.ts`, `schema.ts`'s
  `Schema.define`, and the trailties `db` commands. Making the NullPool arm
  faithful without first giving those call sites a real pool disables metadata
  storage across the suite.

Rails never reaches that arm: its `InternalMetadata` is always built from a
real pool, which is exactly the adapter-vs-pool gap. `db.test.ts`'s
`disableMetadataTable` helper — which stubs `adapter.pool` with a bare
`{ dbConfig: { useMetadataTable: false } }` — exists only because of it and
should disappear with the fix.

Related but distinct:
`migration-context-collaborators-need-a-pool` covers `MigrationContext`'s
optional collaborators;
`check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy`
covers the proxy that async-ifies the sync adapter surface. This story is
specifically `InternalMetadata`'s own constructor arg.

## Converged shape

`InternalMetadata` takes a pool, not an adapter, mirroring
`internal_metadata.rb:20-22`; `enabled` becomes
`this._pool.dbConfig.useMetadataTable` with no `pool == null` /
`!== false` softening, so a NullPool reads as disabled exactly as it does in
Rails. Queries reach a connection through the pool the way Rails' `[]=` does
(`internal_metadata.rb:41-45` — `@pool.with_connection { |connection| ... }`).

## Acceptance criteria

- [ ] `InternalMetadata`'s constructor takes a connection pool
      (`internal_metadata.rb:20-22`), and every construction site hands it one.
- [ ] `enabled` is `@pool.db_config.use_metadata_table?` with no extra arms —
      a NullPool reads as disabled, matching Rails.
- [ ] The deviation note on the `enabled` getter is deleted, not reworded.
- [ ] `db.test.ts`'s `disableMetadataTable` pool stub is gone; the tests turn
      the flag off through a real db_config.
- [ ] `migration.test.ts` "internal metadata not used when not enabled" and the
      trailties metadata suites stay green with no test renames.

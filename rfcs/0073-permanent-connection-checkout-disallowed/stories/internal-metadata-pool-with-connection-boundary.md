---
title: "InternalMetadata takes an adapter, not a pool — public methods never lease a connection"
status: draft
updated: 2026-07-26
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
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

Surfaced while shipping #5329 (arity-internal-metadata-connection-param), which
threaded `connection` through InternalMetadata's five private helpers. That
converged the helper signatures, but NOT the connection-acquisition boundary
above them.

Rails (`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:18-21`)
constructs InternalMetadata over a **pool**:

```ruby
def initialize(pool)
  @pool = pool
  @arel_table = Arel::Table.new(table_name)
end
```

and every public method opens a lease before touching the DB — `[]=` (:38-44),
`[]` (:46-53), `delete_all_entries` (:55-61), `count` (:63-69),
`create_table_and_set_flags` (:71-79), `create_table` (:82-96), `drop_table`
(:98-104) each wrap their body in `@pool.with_connection do |connection| ... end`.
`table_exists?` (:106-108) reads `@pool.schema_cache` instead.

trails' `packages/activerecord/src/internal-metadata.ts:71-75` takes a bare
adapter and stores it as `this._connection`; the public methods use it directly
with no lease. After #5329 the private helpers accept a `connection` argument,
but every caller passes the same constructor-captured `this._connection`, so the
parameter is currently threading a value that was never leased.

Callers to migrate: `migration.ts:2055`, `schema.ts:119`, plus the test
constructions in `migration.test.ts` and `migrator.trails.test.ts:57`.

Related: [with_connection shim] and [retire-direct-adapter-with-connection-shim]
cover the same lease-boundary pattern elsewhere; this is the InternalMetadata
instance of it. Note the known trap that `Model.adapter = x` style direct-adapter
construction breaks naive withConnection ports — the test constructions above are
exactly that shape.

## Acceptance criteria

- `InternalMetadata` is constructed over a pool, matching
  `initialize(pool)`, with `arelTable` still built at construction.
- Public methods (`set`, `get`, `deleteAllEntries`, `count`,
  `createTableAndSetFlags`, `createTable`, `dropTable`) acquire the connection
  via the pool's `withConnection` equivalent and pass it into the private
  helpers, rather than reading a constructor-captured adapter.
- `tableExists` reads through the schema cache like Rails' `table_exists?`,
  or the divergence is justified at the call site if the schema-cache path
  is not yet viable.
- All construction sites updated; existing internal-metadata tests stay green
  with no test renames.

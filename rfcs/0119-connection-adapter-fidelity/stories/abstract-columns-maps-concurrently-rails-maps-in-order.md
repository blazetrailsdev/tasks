---
title: "abstract columns() runs newColumnFromField concurrently where Ruby's map is sequential"
status: done
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7527
claim: "2026-09-05T18:26:52Z"
assignee: "attribute-set-envelope-loses-unregistered-type-keys"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#columns`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:106-112`)
is:

```ruby
def columns(table_name)
  table_name = table_name.to_s
  column_definitions(table_name).map do |field|
    new_column_from_field(table_name, field, column_definitions)
  end
end
```

Ruby's `map` runs the block **once per element, in order, to completion**. The
trails port at
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:797`
instead fires them all at once:

```ts
const definitions = await adapter.columnDefinitions(tableName);
return Promise.all(
  definitions.map((field) => adapter.newColumnFromField(tableName, field, definitions)),
);
```

`new_column_from_field` is not pure on every adapter. PostgreSQL's
(`postgresql_adapter.rb:1060-1080`, ported at
`connection-adapters/postgresql-adapter.ts:2224`) reaches the type map through
`fetch_type_metadata` -> `get_oid_type`, which issues its OWN catalog query via
`loadAdditionalTypes` whenever the OID is unknown
(`postgresql-adapter.ts:561-580`). So `Promise.all` can put N of those in flight
concurrently on ONE connection, where Rails issues them one at a time.

## Converged shape

Await in order, the way Ruby's `map` does:

```ts
const definitions = await adapter.columnDefinitions(tableName);
const columns: Column[] = [];
for (const field of definitions) {
  columns.push(await adapter.newColumnFromField(tableName, field, definitions));
}
return columns;
```

Note Rails passes `column_definitions` (the METHOD, re-invoked) as the third
argument, not the already-materialised `definitions` local — worth checking
whether that re-invocation matters on any adapter while you are in this body.

## Acceptance criteria

- `columns` awaits `newColumnFromField` sequentially; no `Promise.all`.
- All five adapter lanes pass.
- `pnpm parity:api:calls` and `:calls:args` clean, no baseline row added.

## Notes

Found while investigating the PG deadlock in PR #7446. Sequentialising alone
does NOT fix that deadlock — its cause is the pool-mutex/adapter-lock inversion
tracked by `pg-configure-connection-prefills-version-memo` and
`resolve-server-version-before-the-adapter-is-leased` — but the concurrency here
is a real and separate divergence from Ruby's `map`, and it is what puts several
`loadAdditionalTypes` queries in flight at once.

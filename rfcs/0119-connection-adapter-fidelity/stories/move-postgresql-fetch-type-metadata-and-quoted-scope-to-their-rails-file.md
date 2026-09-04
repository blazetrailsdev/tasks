---
title: "Move fetchTypeMetadata and quotedScope off postgresql-adapter.ts into their Rails file, retiring newColumnFromField's receiver retype"
status: draft
updated: 2026-09-03
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`fetch_type_metadata` (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:994`)
and `quoted_scope` (`:1130`) are defined by Rails in
`connection_adapters/postgresql/schema_statements.rb`, but their trails bodies
sit on `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
(`fetchTypeMetadata` and `quotedScope`, adjacent in the file). #7456 moved the
four other privates from that Ruby file into
`postgresql/schema-statements.ts` and left these two behind, because both are
overrides of members the abstract `SchemaStatements` class already declares
with incompatible shapes:

- abstract `fetchTypeMetadata(sqlType: string | null): SqlTypeMetadata`
  (`abstract/schema-statements.ts`) vs PG's
  `(columnName, sqlType, oid, fmod) => Promise<TypeMetadata>` — TS2415 on the
  class, TS2320 through the merged `Pick<PostgreSQLAdapter, ...>` interface.
- abstract `quotedScope(_name?: string | null, _options?): Record<string, string>`
  vs PG's `{ schema: string; name: string | null; type: string | null }`.

`PostgreSQLAdapter` gets away with both because it extends `AbstractAdapter`,
not the abstract `SchemaStatements` class, and picks the mixin up through
declaration merging.

The cost is visible at one call site: `newColumnFromField`
(`postgresql/schema-statements.ts`) reaches its own file's Rails neighbour
through `(this as unknown as PostgreSQLAdapter).fetchTypeMetadata(...)`, where
Rails writes a bare `fetch_type_metadata(column_name, type, oid.to_i, fmod.to_i)`
(`schema_statements.rb:968`). `#7456` shipped that retype; a prose
justification could not be left at the call site because
`no-freeform-comments` strips it.

## Converged shape

Both bodies live in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`
under their Rails names, reached by `PostgreSQLAdapter` through the
`SchemaStatements` mixin like the file's other 92 members, and
`newColumnFromField` calls `this.fetchTypeMetadata(...)` with no receiver
retype.

Getting there means resolving the override shapes rather than routing around
them — most likely by making the abstract declarations the supertypes their
Ruby counterparts already are (Ruby's `fetch_type_metadata` is overridden with
a different arity in three adapters; nothing in the abstract body constrains
the PG shape), or by whatever the reviewed answer turns out to be. Widening the
`Pick<>` list or adding a second cast is not it.

## Acceptance criteria

- `fetchTypeMetadata` and `quotedScope` bodies live in
  `postgresql/schema-statements.ts`; both leave `postgresql-adapter.ts`.
- No `as unknown as PostgreSQLAdapter` in `newColumnFromField`, and no new cast
  anywhere else in the file.
- `connection_adapters/postgresql/schema_statements.rb` stays 92/92 DeclOnly 0
  and `postgresql_adapter.rb` does not regress.
- No baseline row, no allowlist widening, no `@noRailsEquivalent` receipt.
- `pnpm parity:api:calls`, `:calls:args`, `:params`, `:extra:gate` green; PG
  lane green.

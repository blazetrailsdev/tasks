---
title: "PG lookup_cast_type_from_column drops verify!'s promise, so a never-connected adapter cannot answer"
status: closed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8728
claim: "2026-10-09T20:55:38Z"
assignee: "migration-proxy-load-migration-arms-need-a-kernel-load-port"
blocked-by: null
closed-reason: 'PERMANENT: packages/activerecord/CLAUDE.md § "Adapter facts are prewarmed and peeked" ratifies that lookupCastTypeFromColumn keeps Rails'' line in a synchronous reader, cannot await verify!, and that a caller reaching it cold warms first. Its handler carries @inventedArm try — PERMANENT (trails#8728).'
---

## Context

Rails' `PostgreSQL::Quoting#lookup_cast_type_from_column`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189-192`):

```ruby
verify! if type_map.nil?
type_map.lookup(column.oid, column.fmod, column.sql_type)
```

`verify!` connects, which builds the type map, and the lookup then answers from it.

trails#8621 converged the port's shape
(`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`, `lookupCastTypeFromColumn`) to
`if (this.typeMap == null) void this.verifyBang();`. The reader is synchronous and `verifyBang` is
async, so the promise is dropped: on an adapter that has never connected the lookup on the next line
is a `TypeError`, and a failed `verify!` is an unhandled rejection. `typeMap` is null only before the
first connection (`reloadTypeMap`, `postgresql-adapter.ts`, is its one writer).

`buildFixtureSql` (`connection-adapters/abstract/database-statements.ts`) already awaits `verify!`
ahead of its own call. The other callers do not: `model-schema.ts` (`connection.lookupCastTypeFromColumn(column)`),
`type-caster/connection.ts` (through `withConnectionSync`), `connection-adapters/abstract/schema-dumper.ts`,
`schema-dumper.ts`, and `quoteDefaultExpression` in `postgresql/quoting.ts`.

Related: `pg-lookup-cast-type-resolves-only-warmed-type-names` (blocked, RFC 0123) is the same
sync-reader wall for `lookup_cast_type`.

## Acceptance criteria

- [ ] A lookup on a never-connected PostgreSQL adapter answers the real type after `verify!` has
      built the type map, as Rails does, on every caller path that can reach it cold.
- [ ] No dropped `verifyBang()` promise remains in `lookupCastTypeFromColumn`.
- [ ] A `.trails.test.ts` on the PG lane drives a fresh adapter through one such caller and gets the
      real type, not a `TypeError`.

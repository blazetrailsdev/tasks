---
title: "pg-lookup-cast-type-from-column-verify-arm-in-quoting"
status: claimed
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: "2026-09-25T02:10:13Z"
assignee: "async-pluck-pick-ids-take-async-arm"
blocked-by: null
closed-reason: null
---

## Context

trails#8067 deleted the `@missingRailsCall verify! — PERMANENT` receipt on
`PostgreSQLAdapter#lookupCastTypeFromColumn`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`), because
Rails defines no such method in `postgresql_adapter.rb`, so no pair compares it
and the receipt suppressed nothing. The override it sat on is still a deviation:

- Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189-192`):
  `verify! if type_map.nil?` then `type_map.lookup(column.oid, column.fmod, column.sql_type)`.
- trails: an adapter-level override that raises an invented
  `ConnectionNotEstablished("PostgreSQL type map is not loaded; ...")` when
  `_typeMap` is null, then delegates to `postgresql/quoting.ts`
  `lookupCastTypeFromColumn`, which carries no `type_map.nil?` arm at all.

So the `verify!` arm lives in the wrong file with an invented raise, and the
compared pair (`postgresql/quoting.rb` ↔ `postgresql/quoting.ts`) has no arm.
`verify!` is async in trails while the lookup is a sync reader, which is the
obstacle.

## Acceptance criteria

- The `type_map.nil?` arm lives in `postgresql/quoting.ts`
  `lookupCastTypeFromColumn`, the adapter override is deleted, and the invented
  error message is gone.
- The arm calls what Rails calls (`verify!`), or, if the sync reader cannot await
  it, the omission carries `@missingRailsCall verify! — …` at that compared
  site so the call gate judges it.

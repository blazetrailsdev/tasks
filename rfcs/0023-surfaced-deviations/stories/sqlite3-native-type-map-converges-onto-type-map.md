---
title: "Converge SQLite3's _nativeTypeMap/lookup_cast_type onto the inherited type_map path"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
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

`AbstractSQLite3Adapter#lookupCastType`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) has no
Rails counterpart: `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`
only _calls_ `lookup_cast_type_from_column` (:628), and there is no
`sqlite3/quoting.rb` defining `lookup_cast_type` — the only definitions in Rails
are `abstract/quoting.rb:234-236` and `postgresql/quoting.rb:195`.

The override, plus the `_nativeTypeMap` / `_buildTypeMap` slots behind it and
its fetch-full-then-lookup-normalized fallback, is a trails invention — the same
shape as MySQL's, which `mysql-native-type-map-converges-onto-type-map` covers.
PR #5520 ported `AbstractAdapter::TYPE_MAP` (abstract_adapter.rb:942),
`AbstractAdapter.extended_type_map` (877-883) and the abstract
`lookup_cast_type`, so the inherited path exists; the override was left alone
there and its false `Mirrors:` line replaced with `@noRailsEquivalent`.

Ordering hazard, identical to the MySQL story: Rails declares `TYPE_MAP` and
`EXTENDED_TYPE_MAPS` on `SQLite3Adapter` (sqlite3_adapter.rb:505-506) and trails
declares neither, so `self::TYPE_MAP` inside `extended_type_map` resolves to the
abstract map. Deleting `_nativeTypeMap` before adding those declarations would
silently cast every SQLite-specific sql_type through the abstract map.

## Acceptance criteria

- `AbstractSQLite3Adapter` declares its SQLite `initialize_type_map` overrides,
  and `SQLite3Adapter` declares `TYPE_MAP` / `EXTENDED_TYPE_MAPS`
  (sqlite3_adapter.rb:505-506).
- `_nativeTypeMap` / `_buildTypeMap` and the `lookupCastType` override are
  deleted; casting resolves through the inherited `type_map` →
  `extended_type_map` path, including the precision/scale-bearing regex
  registrations the current fallback exists to serve.
- `lookup_cast_type_from_column` behaviour at sqlite3_adapter.rb:628 is
  unchanged.
- SQLite lane green (`ARCONN=sqlite3` and `sqlite3_mem`).

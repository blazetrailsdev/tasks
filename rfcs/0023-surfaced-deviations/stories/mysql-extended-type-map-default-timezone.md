---
title: "Converge AbstractMysqlAdapter.extended_type_map onto super + default_timezone"
status: closed
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by mysql-native-type-map-converges-onto-type-map, which covers the same default_timezone gap plus the duplicate _nativeTypeMap path"
---

## Context

`AbstractMysqlAdapter.extendedTypeMap` (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`)
was a hollow stub (`void options; return new Map()`) until PR #5520, which made
it delegate to `_buildTypeMap({ emulateBooleans })` so it satisfies the newly
ported `AbstractAdapter.extended_type_map` contract
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:877-883`).

Two gaps remain:

- Rails' MySQL override is `super(default_timezone:).tap { … tinyint(1) … }`
  (`abstract_mysql_adapter.rb:702-708`), so it inherits the base map's
  timezone-aware `Type::Time` / `Type::DateTime` registrations. trails'
  `_buildTypeMap` ignores `default_timezone` entirely — the same gap
  `_nativeTypeMap` (used by `lookupCastType`) already has.
- Rails resolves `self::TYPE_MAP` per adapter class; trails only defines
  `TYPE_MAP` on `AbstractAdapter`, so a MySQL `super` call would pick up the
  abstract map rather than MySQL's `initialize_type_map` entries. That is why
  the override rebuilds from `_buildTypeMap` instead of calling super.

## Acceptance criteria

- `AbstractMysqlAdapter` owns a `TYPE_MAP` seeded from its own
  `initializeTypeMap`, so `extended_type_map` can layer on top of `super`
  the way `abstract_mysql_adapter.rb:702-708` does.
- `extendedTypeMap` threads `defaultTimezone` into the time/datetime
  registrations.
- `_nativeTypeMap` / `lookupCastType` resolve through the same map, so a
  connection configured with `default_timezone` casts MySQL datetimes in that
  zone.
- MySQL lane green (`ARCONN=mysql2`).

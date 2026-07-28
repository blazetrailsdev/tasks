---
title: "Adapter initializeTypeMap copies drop base-map aliases instead of calling super"
status: claimed
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-07-28T22:35:45Z"
assignee: "adapter-type-maps-inline-base-map-drop-aliases"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractMysqlAdapter#initialize_type_map`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:711-712`)
and `SQLite3Adapter#initialize_type_map` (`sqlite3_adapter.rb:499-502`) both open
with `super`, so both inherit every registration and alias the base map declares
at `abstract_adapter.rb:885-902` — including the aliases
`blob→binary`, `clob→text`, `timestamp→datetime`, `numeric→decimal`,
`number→decimal`, `double→float`.

trails has no `super` on either path. `AbstractMysqlAdapter.initializeTypeMap`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1859`)
and `AbstractSQLite3Adapter.initializeTypeMap`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:3103`) each
inline their own hand-maintained copy of the base map. Because the copies are
hand-maintained, entries have silently gone missing: PR #5492 found MySQL was
missing both `clob→text` and `number→decimal`, and SQLite was missing
`number→decimal`, and restored those three via `TypeMap#aliasType`
(`packages/activerecord/src/type/type-map.ts:37`, the direct analogue of Rails'
`alias_type`).

Those three were found only because `type_lookup_test.rb`'s `number`/`NUMBER`
assertions (`:64-66`, `:90`) were themselves missing from the port. Nothing
systematically checks the two inlined copies against the base map, so other
base-map entries are likely still absent — the three found so far were not the
result of an audit.

## Acceptance criteria

- [ ] Diff both `initializeTypeMap` implementations against
      `AbstractAdapter.initializeTypeMap` (`abstract-adapter.ts:2160-2190`) and
      enumerate every base-map registration/alias each one omits.
- [ ] Restore each omission that Rails resolves via `super`, or record it at the
      call site as a deliberate, justified override (MySQL/SQLite genuinely
      override some base registrations — e.g. the lob limits and integer
      widths — so an omission is only a bug when nothing replaces it).
- [ ] Use `TypeMap#aliasType` for aliases rather than open-coding the
      metadata-extract-and-relookup; note that doing so may converge a wide
      call-set baseline entry for `alias_type`, which must then be removed from
      `scripts/api-compare/call-mismatches-wide-exclude/`.
- [ ] Cover the restored lookups in `connection-adapters/type-lookup.test.ts`
      (and the mysql/pg counterparts where the type applies), matching Rails'
      assertion lists verbatim — no invented cases.
- [ ] Prefer making the adapters call a shared base-map builder over growing the
      hand-maintained copies, if that can be done without changing the
      registration order the reversed-lookup semantics depend on.

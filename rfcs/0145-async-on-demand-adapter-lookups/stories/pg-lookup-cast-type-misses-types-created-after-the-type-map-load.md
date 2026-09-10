---
title: "lookup_cast_type misses a type created after the last type-map load, where Rails' live ::regtype resolves it"
status: closed
updated: 2026-09-10
rfc: "0145-async-on-demand-adapter-lookups"
cluster: null
packages: []
deps: ["pg-get-oid-type-drops-the-on-demand-load-additional-types"]
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-09-08T11:12:39Z"
assignee: "execute-duplicated-on-adapters-and-wired-per-adapter"
blocked-by: null
closed-reason: "RFC 0145 decision (user, 2026-09-10): a PG type created by raw execute or by another session after the type-map load is out of ActiveRecord's API on both sides. Rails' own DDL paths all reload_type_map (postgresql_adapter.rb:478,489,559,575,584,602,615) plus configure_connection (:996), and trails mirrors every one; the live ::regtype (quoting.rb:196) and load_additional_types([oid]) (:856) only recover from out-of-API staleness. getOidType/lookupCastType stay sync; no warming beyond the 8 points."
---

## Context

Rails resolves a `sql_type` by asking the live server for its OID on every call
(`activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:194-196`):

```ruby
def lookup_cast_type(sql_type)
  super(query_value("SELECT #{quote(sql_type)}::regtype::oid", "SCHEMA").to_i)
end
```

trails resolves against a table captured from the `pg_type` rows the type-map
load already selects (`postgresql-adapter.ts`'s `_captureRegtypeOids`, read by
`postgresql/quoting.ts#lookupCastType`), and carries
`@missingRailsCall query_value — PERMANENT` and
`@missingRailsCall quote — PERMANENT` for the gap.

`pg-lookup-cast-type-misses-types-outside-the-eager-load` (#7538) measured that
gap against a real server and found it is NOT what the receipts describe. It is
not schematic: `query_conditions_for_known_type_types` is
`t.typtype IN ('r', 'e', 'd')` with no namespace filter
(`activerecord/lib/active_record/connection_adapters/postgresql/oid/type_map_initializer.rb`,
mirrored in `postgresql/oid/type-map-initializer.ts:54-56`), so domains and
enums in ANY schema are captured under both their bare and schema-qualified
spellings — pinned by a test in
`packages/activerecord/src/adapters/postgresql/lookup-cast-type.trails.test.ts`.
A composite type (`typtype = 'c'`) resolves to the default value type in trails
AND in Rails, since `load_additional_types` never loads one either.

The residual is temporal: a type created AFTER the last type-map load — by raw
`execute`, since Rails' own `create_enum` / `drop_enum` / `rename_enum` already
`reload_type_map` and trails mirrors that — is absent from the captured table,
so `lookupCastType` answers `ValueType` where Rails' live `::regtype` answers
the real type. Reproduced: creating `CREATE DOMAIN probe_dom AS integer` on a
connected adapter and calling `lookupCastType("probe_dom")` answers the default
type until `reloadTypeMap()` runs, after which it answers `integer`.

`lookupCastType` must stay synchronous — that is the settled outcome of
`pg-lookup-cast-type-async-divergence` (done, #7223); Rails' base contract at
`abstract/quoting.rb:234-236` returns a `Type`, not a promise, and seven
synchronous call sites consume it.

## Converged shape

Close the temporal residual without reopening the sync signature, or narrow the
two receipts to it. Options, in preference order:

1. Invalidate or refresh the captured table where a type can come into
   existence — the adapter already awaits at the DDL paths that call
   `reloadTypeMap`; the gap is raw `execute` of a `CREATE TYPE` / `CREATE
DOMAIN`, which trails could detect the way it already classifies SQL
   (`connection-adapters/sql-classification.ts`).
2. If that is too broad, establish that a type created by raw `execute` is
   outside AR's API on both sides and narrow the receipts to say so — noting
   `blazetrails/no-freeform-comments` strips prose from a tag, so the narrowing
   needs a different vehicle (this story, or a ratified CLAUDE.md section).

Do NOT make `lookupCastType` async; that reverts #7223.

## Acceptance criteria

- [ ] A type created by raw `execute` after connect resolves through
      `lookupCastType` as Rails' `::regtype` resolves it, or the residual is
      established as out-of-API on both sides and the receipts are narrowed to
      exactly that.
- [ ] `lookupCastType` stays synchronous; the base signature keeps returning
      `Type`.
- [ ] A test covers whichever of the two the story lands on.
- [ ] PG lane green (`ARCONN=postgresql`).

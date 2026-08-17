---
title: "converge-pg-lookup-cast-type-from-column-onto-quoting-module"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6663
claim: "2026-08-17T18:08:11Z"
assignee: "compute-cache-version-makes-rails-calls"
blocked-by: null
closed-reason: null
---

## Context

Rails houses `lookup_cast_type_from_column` in the `PostgreSQL::Quoting`
module:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189
def lookup_cast_type_from_column(column)
  verify! if type_map.nil?
  type_map.lookup(column.oid, column.fmod, column.sql_type)
end
```

trails ports that into
`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`, where
the Ruby method's own bucket compares it — **and also keeps a second, full
implementation** on the adapter at
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1033-1050`,
which is not the one-line `include` seam its siblings (`quotedDate`,
`quotedBinary`, `returningColumnValues`, `disableReferentialIntegrity`) are.
That copy calls `this.typeMap.fetch(oid, fmod, sqlType, () => new ValueType())`
where Rails calls `type_map.lookup(...)`, and it drops the
`verify! if type_map.nil?` guard entirely.

Until PR #6659 the divergence was visible as
`call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`'s
`lookup_cast_type_from_column | lookup` row. That PR taught the gate to skip an
`include`-seam member so the mixin's own bucket compares the real body — which
is right for the four genuine seams, but this member is not a seam, so its
divergence is now **unmeasured**. The baseline row was deleted with the others,
and its reason string ("the adapter member is the include seam") was already
inaccurate.

`docs/ruby-ts-conventions.md` / CLAUDE.md: one Rails method is one TS method.
Two bodies for one Rails method is the defect independent of which one is
wrong.

## Converged shape

Delete the adapter's copy and let the adapter reach the module port, as it does
for `quotedDate` — one Rails method, one TS method, in the file mirroring
`postgresql/quoting.rb`. Then converge that single body onto
`quoting.rb:189-192`: the `verify!`-when-`type_map.nil?` guard, and
`type_map.lookup` rather than `typeMap.fetch` with a miss-callback.

If the `fetch` + `ValueType()` fallback is load-bearing (the comment at
`postgresql-adapter.ts:1036-1047` argues a `lookup` miss would poison the map),
that is a claim about trails' `TypeMap`, not a TypeScript language shortcoming
— converge `TypeMap.lookup` to Rails' semantics instead of diverging the
caller, or `tasks block` with the specific blocker.

## Acceptance criteria

- `postgresql-adapter.ts` carries no second `lookupCastTypeFromColumn` body;
  the single port lives in `connection-adapters/postgresql/quoting.ts`.
- That body mirrors `postgresql/quoting.rb:189-192` line for line, including
  the `verify!` guard and the `lookup` call.
- `pnpm parity:api:calls` green with no new baseline row (or one with a
  reviewed reason if the `TypeMap` semantics genuinely block).
- PG lane green — the OID type-cast path is exercised by the existing
  `columns()` / attribute-read tests.

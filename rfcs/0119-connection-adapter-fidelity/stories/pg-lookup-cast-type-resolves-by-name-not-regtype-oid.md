---
title: "PG lookup_cast_type resolves by name string instead of Rails' ::regtype::oid"
status: in-progress
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7257
claim: "2026-08-30T16:19:59Z"
assignee: "virtualizer-maps-time-columns-to-plaintime-but-castvalue-returns-instant"
blocked-by: null
closed-reason: null
---

## Context

Rails resolves a `sql_type` string to a type by asking PostgreSQL for its OID
(`activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:194-196`):

```ruby
def lookup_cast_type(sql_type)
  super(query_value("SELECT #{quote(sql_type)}::regtype::oid", "SCHEMA").to_i)
end
```

`super` is `AbstractAdapter#lookup_cast_type` (`abstract/quoting.rb:234-236`),
so Rails looks the type up **by OID**.

trails' port (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`,
`lookupCastType`, relocated there from the adapter by #7223) substitutes a
regex for the round trip: it strips the `(...)` modifier, collapses
whitespace, and hands the resulting **name string** to the abstract lookup,
which keys the type map by name. It carries
`@missingRailsCall query_value — PERMANENT` and
`@missingRailsCall quote — PERMANENT` for the two omitted calls.

The name-keyed path mostly works because `TypeMapInitializer.run`
(`postgresql/oid/type-map-initializer.ts:78`) calls
`aliasType(row.oid, row.typname)` during the eager load, so eagerly-loaded
types are reachable by `typname`. The residual gap is everything `::regtype`
resolves that a bare `typname` match does not:

- **Schema-qualified names** — `myschema.mytype` is resolved by `::regtype`
  against the search path; it is not a `typname`.
- **Aliases** — `character varying`, `int4`, `int8`, `bool` and friends all
  resolve through `::regtype` to the canonical OID. The type map is keyed on
  the spellings it was seeded with.
- **Domains and user types not in the eager-load set** — `::regtype` resolves
  any type the server knows; the name-keyed map only holds what
  `loadTypesQueries` selected.

In each of those cases trails silently falls through to whatever the
name-keyed map returns (commonly a `ValueType`) where Rails would answer the
real type.

The receipts are marked PERMANENT, but the omission is not a TypeScript
language shortcoming — it is a synchronous-signature constraint with a
reachable fix (below), which is why this is filed as a convergence story
rather than left ratified.

## Converged shape

Keep `lookupCastType` synchronous — the sync signature is the settled outcome
of `pg-lookup-cast-type-async-divergence` and must not regress — and make the
OID resolution available without a round trip:

- Capture a `typname`/alias -> OID map during the eager load, alongside the
  type registration that `TypeMapInitializer` already performs from the same
  `pg_type` rows (it already has `row.oid` and `row.typname`), extending the
  `loadTypesQueries` projection if the alias spellings need `pg_type.typelem`
  / `format_type` to be recovered.
- `lookupCastType` then resolves `sqlType` -> OID against that map and calls
  the abstract lookup **by OID**, which is what Rails' `super` receives.
- Delete both `@missingRailsCall` receipts once the OID path is in.

If the alias/schema-qualified set genuinely cannot be recovered without a
server round trip, narrow the receipts to the specific unresolvable spellings
rather than leaving a blanket PERMANENT on the whole method.

## Acceptance criteria

- [ ] `lookupCastType` looks the type up by OID, as Rails' `super` does, not by
      name string.
- [ ] A test covers at least one alias spelling (e.g. `character varying`) and
      one schema-qualified or domain type resolving to the same type Rails
      answers.
- [ ] `lookupCastType` stays synchronous; PG lane green (`ARCONN=postgresql`).
- [ ] The `query_value` / `quote` receipts are deleted, or narrowed with a
      specific reason rather than a blanket PERMANENT.

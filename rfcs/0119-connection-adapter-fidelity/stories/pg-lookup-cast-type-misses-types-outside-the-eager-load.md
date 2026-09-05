---
title: "lookup_cast_type still misses types outside load_additional_types' eager set"
status: in-progress
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 7538
claim: "2026-09-05T21:46:49Z"
assignee: "commit-db-transaction-should-hold-its-own-internal-execute"
blocked-by: null
closed-reason: null
---

## Context

Rails resolves a `sql_type` to a type by asking the server for its OID on every
call (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:194-196`):

```ruby
def lookup_cast_type(sql_type)
  super(query_value("SELECT #{quote(sql_type)}::regtype::oid", "SCHEMA").to_i)
end
```

`::regtype` resolves anything the server knows: aliases, schema-qualified names,
domains, user types in any schema on the search path.

PR #7257 converged the trails port onto a by-OID lookup — which is what `super`
receives at `abstract/quoting.rb:234-236` — by capturing a `typname` /
`format_type` / alias -> OID table from the `pg_type` rows the eager load
already selects (`postgresql-adapter.ts`, `_captureRegtypeOids`), and resolving
against it in `postgresql/quoting.ts#lookupCastType`. That closed the alias and
schema-qualified cases that the previous name-keyed lookup missed.

A residual set remains: a type the **server** knows but `loadAdditionalTypes`
never selected — a domain or user type in a schema outside the eager-load
queries — is not in the captured table, so `lookupCastType` falls back to the
bare name and the type map answers `ValueType` where Rails answers the real
type. The method keeps `@missingRailsCall query_value — PERMANENT` and
`@missingRailsCall quote — PERMANENT` for this.

The round trip cannot simply be restored. `lookupCastType` is synchronous, which
is the settled outcome of `pg-lookup-cast-type-async-divergence` (done, PR #7223): it was async and issuing exactly this query, and that was converged away
because Rails' `lookup_cast_type` is synchronous and the base contract at
`abstract/quoting.rb:234-236` returns a `Type`, not a promise. Seven synchronous
call sites consume it — `abstract/quoting.ts:149,172`, `abstract-adapter.ts:2113`,
`abstract/schema-statements.ts:1683`, `sqlite3-adapter.ts:644,708`,
`mysql2/database-statements.ts:270`, `mysql/schema-statements.ts:340` — several
duck-typed, so a promise there silently skips `serialize`.

Reviewers have now raised this twice on #7257, so the residual deserves a
tracked home rather than living in a merged PR description.

## Converged shape

Close the residual without reopening the sync signature. Options to evaluate, in
preference order:

1. Widen what the eager load captures so `::regtype`-resolvable spellings are
   present — `loadTypesQueries` already joins `pg_type` on `to_regtype(a.name)`
   for the native type names (`nativeTypeNamesQuery`); the same trick may cover
   domains and search-path schemas.
2. Populate the table on demand from the existing async
   `loadAdditionalTypes([oid])` path when a miss is observed, so the NEXT lookup
   of that spelling resolves — accepting that the first is a miss.
3. If neither reaches the whole set, narrow the two receipts to name the
   specific unresolvable spellings. Note `blazetrails/no-freeform-comments`
   reduces a receipt to its bare permanence token, so a narrowing reason cannot
   live in the tag — it needs a different vehicle, or the rule needs to permit
   one.

Do NOT make `lookupCastType` async; that reverts #7223.

Related: `pg-eager-load-additional-types-duplicates-the-rails-loader` (RFC 0119)
converges the two loaders that both feed this table.

## Acceptance criteria

- [ ] A domain or user type outside the eager-load set resolves to the type
      Rails' `::regtype` answers, or the receipts name exactly which spellings
      do not.
- [ ] `lookupCastType` stays synchronous and the base signature keeps returning
      `Type`.
- [ ] A test covers the newly-resolving spelling.
- [ ] PG lane green (`ARCONN=postgresql`).

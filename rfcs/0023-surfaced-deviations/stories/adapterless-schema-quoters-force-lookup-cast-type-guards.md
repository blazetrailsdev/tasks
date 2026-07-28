---
title: "Adapter-less schema quoters force non-Rails guards in quote_default_expression"
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

`quote_default_expression` and `lookup_cast_type_from_column` in
`packages/activerecord/src/connection-adapters/abstract/quoting.ts` carry
guards Rails does not have: Rails calls `lookup_cast_type(column.sql_type)`
unconditionally (`abstract/quoting.rb:161` and `:125-127`), because every host
of that module is an adapter with a `type_map`.

trails binds the same standalone functions to two adapter-less hosts —
`ABSTRACT_SCHEMA_QUOTER` (quoting.ts:70, the SQL-92 fallback used when DDL is
built without a live adapter) and the MySQL schema quoter — neither of which
has a type map. The guards (`this.lookupCastType?.(…)`, and the raw-sqlType
fallback in the standalone `lookupCastTypeFromColumn`) exist only for them, so
a value quoted through those hosts silently skips `serialize`.

PR #5520 ported `AbstractAdapter#lookup_cast_type` (abstract/quoting.rb:234)
and collapsed the _adapter_ method to Rails' one-liner; only the standalone
module version still branches, with the reason recorded at the call site.

## Acceptance criteria

- The adapter-less quoter hosts either carry a real type map or are shown to be
  unnecessary (every DDL path reaches a live adapter), so
  `quote_default_expression` can dispatch `lookup_cast_type` unconditionally as
  abstract/quoting.rb:161 does.
- The `?.` guard and the raw-sqlType fallback in
  `abstract/quoting.ts`'s `lookupCastTypeFromColumn` are deleted.
- Schema/DDL default quoting is unchanged across all adapter lanes, including
  binary and array defaults.

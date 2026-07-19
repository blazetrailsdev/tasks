---
title: "Live-PG coverage that reflected columns carry oid/fmod into quoteDefaultExpression"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4953, which converged PG `quote_default_expression`'s array
branch onto `lookupCastTypeFromColumn` and then had to fix a follow-on
defect: the wrapper rebuilt a `{ sqlType }`-only column and dropped the live
column's `oid`/`fmod`, so reflected columns resolved through the
formatted-name fallback instead of the exact OID/fmod cast type. Rails keys
the lookup on `(oid, fmod, sql_type)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:191`).

The fix landed with unit coverage only
(`connection-adapters/postgresql-adapter.type-map.test.ts`): both tests drive
a _mocked_ type map and a hand-built `{ oid, fmod, sqlType }` literal. Nothing
exercises a real reflected `Column`, so the assumption that a live PG column
actually carries a populated `oid`/`fmod` by the time
`quoteDefaultExpression` runs is untested. That assumption is the load-bearing
one — if it is false, the OID branch silently never fires and the code
degrades to the same name fallback the fix removed, with green unit tests.

Note the defect was invisible to two automated review passes; only reading
`quoting.rb:191` argument-by-argument caught it. A live round-trip is the
check that would have caught it mechanically.

## Acceptance criteria

- [ ] A PG-gated test does `changeColumnDefault` (or reads a default via
      `columns()`) on a real table with an array and a `numeric(p,s)` column,
      asserting the emitted default matches the OID/fmod-resolved cast type.
- [ ] Assert a live reflected `Column` reaching `quoteDefaultExpression`
      has a non-null `oid`, so the OID branch is proven reachable in
      production rather than only in unit fixtures.
- [ ] Keep DDL cost low — ride canonical tables; do not add a bespoke table
      (see CLAUDE.md canonical-tables rule).
- [ ] test:compare delta non-negative.

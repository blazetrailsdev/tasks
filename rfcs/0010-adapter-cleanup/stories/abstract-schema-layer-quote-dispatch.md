---
title: "Abstract schema layer: dispatch quoting through the adapter, tighten fallback quoters"
status: ready
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the `drop-legacy-crutches` audit (Q6 — follow-up to Q1–Q5). Q1–Q3 converted
the **concrete** adapter dirs; this story covers the freestanding-quoting crutches
in the **abstract** schema layer, which are shared by every adapter and so
higher-value.

Sites:

- `connection-adapters/abstract/schema-statements.ts:1318,1321,1351` — calls the
  freestanding `quote()` for SchemaMigration version inserts. It's a
  `this.adapter`-typed mixin, so it should dispatch `this.adapter.quote(...)`; a
  dialect with non-standard literal quoting otherwise gets abstract quoting here.
- `connection-adapters/abstract/schema-creation.ts:47–50` and
  `connection-adapters/abstract/schema-definitions.ts` — `SchemaCreation`
  constructs an inline fallback quoter
  (`{ quoteIdentifier: abstractQuoteIdentifier, quoteTableName:
abstractQuoteTableName, quoteDefaultExpression: abstractQuoteDefaultExpression }`)
  when built without an adapter — the same fallback-crutch shape as
  `sanitization.ts`'s `ABSTRACT_QUOTER` (Q4). Not a correctness bug _if_ every
  real caller passes the adapter, but audit the constructors and require the
  adapter (or keep a guarded fallback with a documented reason) so DDL built here
  always uses the live dialect.
- `connection-adapters/mysql/schema-definitions.ts` /
  `connection-adapters/mysql/schema-creation.ts` import `quoteDefaultExpression`
  from `../abstract/quoting.js` — fold these into the conversion done by
  `mysql-schema-modules-quote-dispatch` (Q2) if that hasn't already; otherwise
  cover them here. Do not double-claim the same lines as Q2.
- `relation.ts:4133` — `sanitizeAsSqlComment` freestanding fallback. It already
  prefers `adapter.sanitizeAsSqlComment` when present; only the no-adapter
  fallback uses the import. Minor; tighten alongside the others or leave with a
  comment.

Out of scope: the per-adapter Q1–Q3 sites, the `sanitizeSqlArray` `ABSTRACT_QUOTER`
(its own story Q4), relocating non-quoting helpers (Q7). Not RFC 0019.

## Acceptance criteria

- [ ] `abstract/schema-statements.ts` SchemaMigration inserts quote via
      `this.adapter.quote`, not the freestanding `quote()`
- [ ] `SchemaCreation`/`schema-definitions` no longer silently fall back to
      abstract-dialect quoting when an adapter is available (require the adapter,
      or keep a guarded, documented fallback)
- [ ] MySQL abstract `quoteDefaultExpression` imports dispatched through the
      instance (here or folded into Q2, not duplicated)
- [ ] No behavior change for adapters that already passed an adapter; emitted DDL
      is byte-identical on PG/MySQL/SQLite
- [ ] Touched schema/migration tests pass on all three adapters (run only the
      touched files locally)
- [ ] `api:compare` delta non-negative

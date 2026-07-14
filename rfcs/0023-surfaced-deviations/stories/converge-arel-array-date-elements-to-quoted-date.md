---
title: "converge-arel-array-date-elements-to-quoted-date"
status: ready
updated: 2026-07-14
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
closed-reason: null
---

## Context

Surfaced during review of PR #4751/#4851
(quote-array-literal-threads-dialect-for-datetime-elements). #4851 fixed the
REAL inline `datetime[]` INSERT path by routing the two `base.ts` insert sites
and `insert_all` through the adapter's `quote` (Rails' `quote(encode_array(value))`
→ `type_cast_array` → `type_cast` → `quoted_date`), so array elements get
per-element `type_cast` (datetimes → `quoted_date`, binary → hex) instead of the
bare `String(Data)` → pure `OID::Array#encode` they fell to before. The encoder
stays pure, matching Rails (`PG::TextEncoder::Array` never type-casts).

That leaves the OTHER, trails-invented array-literal serializer,
`quoteArrayLiteral` (`packages/arel/src/quote-array.ts`), still ISO-fallthrough.
It is a parallel path to the adapter's `encode_array` (Rails has only
`encode_array`), reached by the Arel PG visitor's `quote()`
(`postgresql.ts:134`). Two sibling gaps there, both the same scalar-vs-array split
(and ideally this trails-invented parallel is retired in favor of routing the
visitor's array `quote()` through the adapter's `encode_array` too):

1. **Arel PG visitor array path** — `packages/arel/src/visitors/postgresql.ts:134`
   calls `quoteArrayLiteral(value)` with NO `formatElement`, so a date-like
   array element falls to the duck-typed `toISOString` branch
   (`quote-array.ts:36-41`) and emits ISO-8601 (`2026-04-26T14:23:55.000Z`),
   while the visitor's SCALAR path routes through `quotedDate`
   (`to-sql.ts:1525-1531`, `2067-2079`) and emits the db form
   (`2026-04-26 14:23:55`). The visitor already owns `quotedDate`; it can pass a
   `formatElement` that returns the BARE (un-single-quoted) date form for
   date-like elements. NOTE: `quotedDate` returns an already-`'`-wrapped string,
   whereas `formatElement` must return the bare element content (quoteArrayLiteral
   wraps it in `"..."`). So this needs `quotedDate`'s formatting split from its
   single-quoting (extract a bare formatter), not a naive `this.quotedDate(v)`
   pass — that would double-quote.

2. **JS `Date` array element** — `quote-array.ts:31-33` keeps ISO-8601 for a
   `Date`, while a Temporal sibling now gets the db form. Rails' `type_cast`
   sends `Date` and `Time` alike to `quoted_date`
   (`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:104`).
   Currently self-consistent with scalar `quoteSqlValue` (base.ts also ISO-quotes
   `Date`), but both diverge from Rails.

Rails reference confirming array elements get `quoted_date`:
`quote(OID::Array::Data)` → `encode_array` → `type_cast_array` (recurses into
nested arrays, `postgresql/quoting.rb:221-226`) → `type_cast` →
`when Date, Time then quoted_date(value)` (`abstract/quoting.rb:94-107`);
`quoted_date` BC + fixed-6 μs at `abstract/quoting.rb:184-196`.

## Acceptance criteria

- [ ] Arel PG visitor's array path (`postgresql.ts:134`) threads a `formatElement`
      so date-like array elements match its own scalar `quotedDate` output
      (bare `YYYY-MM-DD HH:MM:SS[.ffffff]`), not ISO-8601. Split `quotedDate` into
      a bare formatter + the `'`-quoting wrapper so the array path reuses the
      bare form without double-quoting.
- [ ] Decide + converge the JS `Date` array-element case: either route `Date`
      through the same date formatter (Rails-faithful) or document why trails
      keeps ISO for raw `Date` (and keep scalar + array consistent either way).
- [ ] Unit coverage for both: a `Date`/date-like element in an arel PG array
      literal emits the db date form matching the scalar path.
- [ ] test:compare / api:compare delta non-negative.

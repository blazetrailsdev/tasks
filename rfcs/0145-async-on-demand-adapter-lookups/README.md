---
rfc: "0145-async-on-demand-adapter-lookups"
title: "On-demand adapter lookups that Rails resolves with a live query"
status: active
created: 2026-09-10
updated: 2026-09-10
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
priority: 2
---

# RFC 0145 — On-demand adapter lookups that Rails resolves with a live query

## Summary

Three RFC 0119 stories are blocked on the same shape: **Rails issues a live
query in the middle of a lookup that trails made synchronous by a merged,
reviewed decision.** Neither available outcome is open to the story author —
converging means reverting a merged decision, and ratifying is not an outcome
trails allows — so each one stalls at an RFC-level question no story is
permitted to answer. This RFC is where that question gets answered.

## Motivation

### The three stories, and the decisions they collide with

- **`pg-get-oid-type-drops-the-on-demand-load-additional-types`** — converging
  requires awaiting `load_additional_types([oid])` inside `getOidType`, which
  `pg-fetch-type-metadata-async-forces-a-union-on-the-abstract` (merged) made
  synchronous _deliberately_, so `fetch_type_metadata` / `cast_result` /
  `new_column_from_field` could stay synchronous as they are in Rails.
- **`pg-lookup-cast-type-misses-types-created-after-the-type-map-load`** — Rails'
  `lookup_cast_type` issues a live `SELECT <type>::regtype::oid` per call
  (`postgresql/quoting.rb:194-196`); trails' `lookupCastType` is synchronous by
  the settled outcome of `pg-lookup-cast-type-async-divergence` (#7223). Its
  option 1 — sniffing raw `execute` for `CREATE TYPE` / `CREATE DOMAIN` and
  reloading the type map — invents a mechanism Rails has no counterpart for, in
  the one method whose Rails body is `super ensure @notice_receiver_sql_warnings = []`.
- **`mysql2-internal-execute-and-exec-query-overrides-rails-lacks`** — the two
  overrides are the only async site running `_enrichMismatchedForeignKey`
  (`column_for`, `abstract_mysql_adapter.rb:995`); deleting them reds the five
  `mysql2_adapter_test.rb` "which has type" tests (`:145,:171,:201,:229,:258`).
  It also carries a second, separable blocker (see Non-goals).

### Why this cannot be settled story-by-story

Each story's only converging move is to revert a merged decision that other
merged code now depends on. "Converge, never ratify" is correct as a rule and is
exactly what leaves these three stuck: the deviation register entry they would
have to write is forbidden, and the convergence they would have to perform is
larger than their own diff. That is the definition of RFC-level work.

## Design

**The direction is decided: B — warm the type map so the on-demand load is never
needed.** The sync signatures of `getOidType`, `lookupCastType`,
`fetch_type_metadata`, `cast_result` and `new_column_from_field` stand, and the
behavioral gap closes by reloading trails' type map at the points where Rails
would have discovered a new OID.

Rails' live query exists because its type map can go stale, not because the
query is the interesting part: `lookup_cast_type` issues
`SELECT <type>::regtype::oid` per call (`postgresql/quoting.rb:194-196`) and
`get_oid_type` falls back to `load_additional_types([oid])`. Both are recovery
from staleness. A type map that is not stale reaches the same answer with no
query, and keeps the five methods in the synchronous shape Rails gives them.

This also means the two merged decisions —
`pg-fetch-type-metadata-async-forces-a-union-on-the-abstract` and
`pg-lookup-cast-type-async-divergence` (PR 7223) — stand rather than being
reverted. They chose the right signatures; what was missing was the freshness
guarantee behind them.

### The one thing that can falsify this

B is convergence only while the reload points mirror Rails' own discovery
points, each anchored to a `vendor/rails` `file:line`. If the reload points can
only be found by sniffing SQL text for `CREATE TYPE` / `CREATE DOMAIN`, B has
turned into the invented mechanism that option 1 of
`pg-lookup-cast-type-misses-types-created-after-the-type-map-load` was already
rejected for — a mechanism Rails has no counterpart for, in the one method whose
Rails body is `super ensure @notice_receiver_sql_warnings = []`.

That is the single condition under which this decision reopens. It is not a
licence to fall back to A quietly: escalate to the RFC, with the enumeration
attempt as evidence.

## Non-goals

- **`mysqlQuote`'s retirement** (the other half of the mysql2 story). Its
  blocker is unrelated: the double-quote-to-backtick half is load-bearing for
  hand-written SQL across `migration.test.ts` (9), `active-record-schema.test.ts`
  (6), `unsafe-raw-sql.test.ts` (2), `nested-through-associations.test.ts` (1)
  and 4 `finder.test.ts` placeholder bodies. Converging those SQL literals to
  Rails' spelling is its own story and does not belong to this RFC.
- **The connection-pool sync spine.** Different root cause; see
  `0000-exclusive-connection-leasing`.

## Alternatives considered

- **A — make `getOidType` and `lookupCastType` async**, reverting the sync-union
  decisions and taking `fetch_type_metadata`, `cast_result` and
  `new_column_from_field` async with them. Not chosen: it spreads async through
  the PG type path and moves five methods away from Rails' synchronous shape to
  buy a freshness guarantee that B provides without a signature change.
- **Ratify each with a PERMANENT receipt.** Not an available outcome
  (CLAUDE.md: a documented deviation is debt, not permission), and it is what
  each story already refused.
- **Let each story decide independently.** Rejected: they would reach three
  different answers to one question, and two of them would be reverting the same
  merged decision from opposite directions.

## Rollout

1. Phase 1 — decide A or B for the PG type path, with measurements.
2. Phase 2 — apply to `pg-get-oid-type-drops-the-on-demand-load-additional-types`.
3. Phase 3 — apply to `pg-lookup-cast-type-misses-types-created-after-the-type-map-load`.
4. Phase 4 — the mysql2 exception-translation half (AC1/AC3), which needs RFC
   0076's awaitable exception-translation path.

## Verification

RFC 0119's blocked count drops by 3. `getOidType` and `lookupCastType` either
match Rails' live-query behavior or provably cannot observe a stale type map;
no `@missingRailsCall` receipt for `load_additional_types` or the `regtype`
query remains in the PG adapter.

## Open questions

1. **Resolved (2026-09-10): B, warm the type map.** The sync signatures stand
   and the merged decisions behind them are not reverted. Reopens only on the
   falsifying condition in Design — that Rails' discovery points cannot be
   enumerated without sniffing SQL text.

## Changelog

- 2026-09-10: initial RFC
- 2026-09-10: Design decided — option B (warm the type map); A recorded under
  Alternatives considered

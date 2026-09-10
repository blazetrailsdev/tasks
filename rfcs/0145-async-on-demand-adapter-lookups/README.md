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

Answer one question for the whole cluster, then apply it three times:

**Is an async `getOidType` / `lookupCastType` on the table, accepting that
`fetch_type_metadata`, `cast_result` and `new_column_from_field` go async with
them?**

The two candidate answers, both of which are genuine convergence:

- **A — go async.** Revert the sync-union decisions; the affected methods become
  async and their call sites await. Cost: async spreads through the PG type
  path, and it moves those four methods away from Rails' synchronous shape.
- **B — warm the type map so the on-demand load is never needed.** Rails' live
  query exists because its type map can be stale; if trails' type map is
  reloaded at the points Rails would have discovered a new OID, the sync
  signature stays and the behavioral gap closes. Cost: the reload points must
  mirror Rails' discovery points exactly, or this becomes the invented
  `CREATE TYPE` sniffing that option 1 was rejected for.

The decision belongs in this RFC's Phase 1, taken once, with the PG lane's
measurements in hand.

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

1. **Is reverting a merged, reviewed decision the right precedent?** It is when
   the decision was taken with less information than we now have — both merged
   stories chose sync to preserve Rails' signature, before the behavioral gap
   was measured. Recommendation: yes, and record it in the reverting PR.

## Changelog

- 2026-09-10: initial RFC

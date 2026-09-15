---
rfc: "0000-sync-schema-reflection-readers"
title: "Sync schema-reflection readers: converge callers async or ratify the peek"
status: draft
created: 2026-09-15
updated: 2026-09-15
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - schema-cache-sync-readers
  - connection-lease
---

<!-- Unnumbered until merge; scripts/finalize-rfc.mjs assigns the number. -->

# RFC — Sync schema-reflection readers

## Summary

Ruby's schema-cache readers (`columns_hash(pool, table)`, `data_source_exists?`,
`primary_keys`) and `with_connection` block on a checkout. In trails they are async,
so every synchronous caller reads a query-free cache peek (`getCachedColumnsHash`,
`getCachedDataSourceExists`, `getCachedPrimaryKeys`, `leaseConnectionSync`) instead.
RFC 0073 parked that residue behind the `permanent_connection_checkout = :disallowed`
flip. The flip landed in trails#7781, but it cannot retire the peeks: JS has no
synchronous await, so arming the setting does not let a sync reader block. This RFC
owns the decision RFC 0073's leftover stories were actually waiting on.

## Motivation

A triage audit on 2026-09-15 (report
`audits/active-rfc-open-stories-20260915T145633Z.md`) found that these blocked stories
all share one root cause, and each one's recorded "flip still draft" reason is now stale:

- RFC 0073:
  - `retire-schema-cache-sync-readers-after-checkout-flip`
  - `retire-pre-reflection-attribute-seed-fallback`
  - `reflection-adapter-cold-pool-sync-lease-flips-permanent`
  - `typecaster-connection-drops-datasource-gate-and-with-connection`
  - `pg-quote-string-escapes-without-with-raw-connection`
- RFC 0123:
  - `converge-get-primary-key-lease-free-schema-cache-reads`
  - `sync-reads-of-async-reflection-retire-with-rfc-0073`
  - `delete-the-internal-schema-cache-accessor`
  - `seed-default-attributes-inside-with-connection`

The peeks are live in `model-schema.ts`, `attribute-methods/primary-key.ts`,
`type-caster/connection.ts`, `connection-adapters/schema-cache.ts` and
`abstract/connection-pool.ts` (`leaseConnectionSync`, read at `model-schema.ts`,
`connection-handling.ts` and `associations/alias-tracker.ts`).

## Design

Decide between two coherent end states per caller class, then rehome the stories
above here and rewrite their acceptance criteria to match.

1. **Converge the callers async.** Make each synchronous reader's Rails-shaped caller
   awaitable (`primaryKey`, `_defaultAttributes`, `typeForAttribute`, the quoting
   chain), so it can call the Rails-named async reader inside `withConnection`. The
   cost is measured per caller before committing; the quoting chain and `new Model()`
   are the expensive ones.
2. **Ratify the peek.** Where a caller cannot go async without breaking a sync Rails
   API (model construction, `to_sql`, `quote`), add a CLAUDE.md section, as
   "Relation is evaluated by an async query" did, naming the peek members as the one
   sanctioned shape. Convert their receipts to `PERMANENT` and close the matching
   stories under it.

A mixed outcome is expected: option 1 where a caller is already reached from async
code, option 2 on construction and quoting.

## Non-goals

- **Pool serialization of shared adapters** (NullLock, SQLite statement lock,
  server-version wrapper, FutureResult mutex): a separate decision about
  concurrent promises on one adapter, not about sync reads.
- **`Relation#toSql` / Arel acquisition seam**: already ratified by CLAUDE.md
  § "`Relation` is evaluated by an async query".

## Alternatives considered

- **Leave the stories blocked in RFC 0073 / 0123.** Their recorded gate (the checkout
  flip) has landed, so the blocker text is false, and the real decision would have no
  owner.
- **A synchronous query seam** (a blocking driver call or worker-thread `Atomics.wait`).
  Not available for the async `pg`/`mysql2` drivers, and it would reintroduce blocking
  I/O on the event loop that every other convergence in the repo avoids.
- **Warm every cache eagerly at connect time** so peeks never miss. This was already
  tried as `eagerLoadSchemaCache`, which is itself one of the members to retire. It
  moves the miss window rather than closing it.

## Rollout

1. **Phase 1: classify.** Measure, for each caller below, whether every Rails caller
   above it is already reached from async code (option 1 candidate), or whether it
   sits under a sync Rails API (option 2 candidate). Record the classification in
   this RFC.
   - Likely option 1: `typecaster-connection-drops-datasource-gate-and-with-connection`,
     `converge-get-primary-key-lease-free-schema-cache-reads`.
   - Likely option 2: `pg-quote-string-escapes-without-with-raw-connection` (under sync
     `quote` / `to_sql`), `retire-pre-reflection-attribute-seed-fallback` and
     `seed-default-attributes-inside-with-connection` (under `new Model()`),
     `reflection-adapter-cold-pool-sync-lease-flips-permanent`.
2. **Phase 2: option 1 conversions,** one caller per story.
3. **Phase 3: ratification.** A CLAUDE.md section for the remaining peeks, with
   receipts converted to `PERMANENT`. Close the stories it covers.
4. **Phase 4: retire the shared residue** that neither phase leaves a caller for:
   `retire-schema-cache-sync-readers-after-checkout-flip`,
   `delete-the-internal-schema-cache-accessor`,
   `sync-reads-of-async-reflection-retire-with-rfc-0073`.

## Verification

- Every `@noRailsEquivalent CONVERGEABLE` and `@missingRailsCall … CONVERGEABLE` receipt
  citing one of the nine stories is either deleted (option 1) or `PERMANENT` under the
  new CLAUDE.md section (option 2). Target: 0 CONVERGEABLE receipts naming them.
- `getCachedColumnsHash` / `getCachedDataSourceExists` / `getCachedPrimaryKeys` /
  `leaseConnectionSync` have callers only at ratified sites.
- `connection-handling.test.ts` "common APIs don't permanently hold a connection" stays
  green on all three lanes under `permanent_connection_checkout = :disallowed`.

## Open questions

1. **Who judges "too expensive to go async", and against what?** Options: a fixed
   rule (any caller under a sync Rails public API is option 2); or a per-caller
   measured cost (call-site count plus hot-path benchmark). Recommendation: the fixed
   rule, since it matches how the Relation thenable was ratified and needs no
   benchmark.
2. **One CLAUDE.md section or per-member receipts?** Recommendation: one section,
   named members, as § "Call-time constant resolution" does.
3. **Does this RFC also own `pg-lookup-cast-type-resolves-only-warmed-type-names`?**
   It is the same sync-read shape (sync `lookupCastType` over a warmed map).
   Recommendation: yes, add it in Phase 1.

## Changelog

- 2026-09-15: initial draft, from the active-RFC triage audit.

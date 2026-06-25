---
rfc: "0005-activerecord-gaps"
title: "ActiveRecord parity gaps — associations, connection-pool, relation"
status: active
created: 2026-05-29
updated: 2026-05-29
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - associations
  - connection-pool
  - relation
---

# RFC 0005 — ActiveRecord parity gaps

## Summary

Consolidates the three remaining ActiveRecord "gap" trackers — associations,
connection-pool, and relation — into one RFC. Each cluster holds the still-open,
actionable work items as stories; the associations and relation layers are still
active, while connection-pool is mostly shipped with a residual tail. Items that
need a design decision, are architectural/cross-cutting, or are permanently
skipped are recorded in §Deferred (not as stories) so the rationale is preserved
without polluting the ready queue.

## Motivation

After the bulk of AR parity shipped, three plan docs tracked the long tail of
per-layer gaps. They were prose checklists mixing ready work, externally-blocked
items, and "won't do" notes — hard to query for "what's unblocked right now?"
This RFC turns the actionable remainder into dep-aware stories so `tasks ready`
surfaces exactly the pickable items per cluster.

## Design

This RFC is a backlog, not a single technical change — the design lives in each
story. Three clusters group the work by AR layer:

- **associations** — the largest active cluster: eager-load raise semantics,
  strict-loading wiring, through-WHERE placement, Track-9 single-test gaps,
  collection identity, dependent-dispatch consolidation, HMT fixes, plus
  fixture-gated (D2) and nested-through-gated work.
- **connection-pool** — mostly shipped; residual reconnect/retry porting, env
  resolution, sqlite open-uri, and several tests gated on P9 / a Rails refresh /
  a CI lane.
- **relation** — a handful of ready cleanups (FK-derivation consolidation,
  inOrderOf cast, reorder alignment, the belongsTo-accessor null bug).

The query-cache items that the connection-pool doc tracked (PF2 / `QueryCache.run`
pool modeling, `cache`/`uncached` relocation) are **not** here — they live in
[[RFC 0004]] (`0004-query-cache-mixin`). The column-matcher dedup is also
subsumed by RFC 0004 Phase 3.

## Alternatives considered

- **One RFC per gap doc (0005/0006/0007).** Rejected — connection-pool and
  relation are nearly done; three thin RFCs add ceremony. One RFC with clusters
  keeps related AR-parity work together and lets `next-bundle --cluster` target a
  layer.
- **Migrate the docs verbatim as RFCs.** Rejected — the docs mix ready work with
  architectural musings and permanent-skips; lifting all of it into stories would
  bury the pickable items. Only actionable items become stories.

## Rollout

No strict ordering across clusters — stories are independent unless `deps` say
otherwise. Pick by cluster: `tasks next-bundle --cluster associations`
(or `connection-pool` / `relation`). The only intra-RFC dep is
[pool-cached-find-by-statement-cache](stories/pool-cached-find-by-statement-cache.md)
→ [pool-allow-retry-forwarding](stories/pool-allow-retry-forwarding.md).

## Open questions

1. **D2 / nested-through unblocking.** D2 waits on Phase G fixtures (a trails doc,
   not an RFC); the nested-through remainder waits on H2. Track those externally
   and flip the blocked stories to `ready` when they land.
2. **Relation deferred items (below).** Several need an API/design decision before
   they can be storied — promote them out of §Deferred when decided.

## Deferred / out-of-scope (NOT stories)

Recorded for rationale; do not lift into the ready queue without a decision.

**Associations — architectural / deferred:** collection-store unification
(`_cachedAssociations` + CollectionProxy `_target` → one store) — now its own
**RFC 0006** (`0006-collection-store-unification`), no longer deferred here;
`join_middle_table_alias` (blocked on reflection + composite-PK join infra);
persisted-owner HABTM source-FK governance; callback-dispatch collapse + Rails
all-or-nothing `catch(:abort)`; CPK fixture demodulize gap; `Relation#extending`
block form; sync-reader `:log` fidelity; `disableJoins` specs (5);
HABTM new-owner stray join row; nested-error semantics (needs
`accepts_nested_attributes_for`); CollectionProxy new-owner through-rows (no
triggering test yet). **Permanent-skip:** `extension.test.ts` + has-many marshal
tests (no TS Marshal).

**Connection-pool — deferred / permanent:** `_inUse` vs Rails `@owner`
divergence; `SQLite3Adapter` missing `reconnectBang`; `replica?` false-vs-nil;
bare-name URI carve-out; sync `checkout()` fire-and-forget `verifyBang`;
`AdapterConnectionTest` `remote_disconnect` tests (permanent — needs server-level
kill); ConnectionManagement middleware (subsumed by a future Executor port);
async-queries cancel-on-exception (different plan); pin_connection tests
(Phase 6).

**Relation — needs design decision:** R6c parameterized join strings (not
Rails-faithful); join table-aliasing (large track); enum write-casting for string
labels; async `inspect()` API; `where` Duration/Rational casts;
`narrowToProjectedColumns` schema-cache source; implicit-id PK tracking.
`select`-narrowing and polymorphic/nested-where tests are gated on join
table-aliasing. **Permanent-skip / cross-blocked:** `load_async`/FutureResult
(thread pool), GVL/fork, `SimpleDelegator where`, `findOrCreateBy` race,
calculations-with-associations (Phase G), `lock!` cosmetic divergence.

## Changelog

- 2026-05-29: initial RFC, migrated from the three trails gap docs
  (`associations-gap-plan.md`, `connection-pool-gap-plan.md`,
  `relation-gap-plan.md`).

---
rfc: "0005-activerecord-gaps"
title: "ActiveRecord parity gaps — associations, connection-pool, relation"
status: active
created: 2026-05-29
updated: 2026-05-29
owner: "@dmarano"
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

## Stories

### associations

| ID                                                                                            | Title                                | Status  | Est LOC |
| --------------------------------------------------------------------------------------------- | ------------------------------------ | ------- | ------- |
| [af5-eager-load-raise-semantics](stories/af5-eager-load-raise-semantics.md)                   | AF5 — eager_load raise vs fallback   | ready   | 150     |
| [af11-strict-loading-test-unblocks](stories/af11-strict-loading-test-unblocks.md)             | AF11 — strict-loading test stubs     | ready   | 90      |
| [af12-preload-through-where-placement](stories/af12-preload-through-where-placement.md)       | AF12 — through-WHERE placement       | ready   | 50      |
| [track9-single-test-gaps](stories/track9-single-test-gaps.md)                                 | Track 9 — scattered single-test gaps | ready   | 110     |
| [collection-size-identity-reconciliation](stories/collection-size-identity-reconciliation.md) | Collection size / AR-id identity     | ready   | 70      |
| [strict-loading-cascade-proxy](stories/strict-loading-cascade-proxy.md)                       | Strict-loading cascade on proxy      | ready   | 80      |
| [dependent-dispatch-consolidation](stories/dependent-dispatch-consolidation.md)               | Consolidate dependent dispatch       | ready   | 80      |
| [assoc-scope-polymorphic-through-alias](stories/assoc-scope-polymorphic-through-alias.md)     | Polymorphic-through alias coverage   | ready   | 50      |
| [error-message-dead-code-hygiene](stories/error-message-dead-code-hygiene.md)                 | Error wording + dead-code hygiene    | ready   | 60      |
| [hmt-self-ref-belongs-to-push](stories/hmt-self-ref-belongs-to-push.md)                       | Self-ref belongsTo-source HMT push   | ready   | 100     |
| [hmt-scope-join-aware](stories/hmt-scope-join-aware.md)                                       | Join-aware HMT scope()               | ready   | 15      |
| [d2-has-one-fixture-bodies](stories/d2-has-one-fixture-bodies.md)                             | D2 — has_one fixture bodies          | blocked | 200     |
| [nested-through-remainder](stories/nested-through-remainder.md)                               | Nested-through remainder             | blocked | 200     |

### connection-pool

| ID                                                                                            | Title                                | Status  | Est LOC |
| --------------------------------------------------------------------------------------------- | ------------------------------------ | ------- | ------- |
| [pf5-connection-handler-reaudit](stories/pf5-connection-handler-reaudit.md)                   | Re-audit 11 skipped handler tests    | ready   | 50      |
| [pool-env-resolution-unify](stories/pool-env-resolution-unify.md)                             | Unify env resolution                 | ready   | 40      |
| [pool-reap-flush-expire-audit](stories/pool-reap-flush-expire-audit.md)                       | Audit \_available re-add sites       | ready   | 25      |
| [pool-sqlite-open-uri](stories/pool-sqlite-open-uri.md)                                       | SQLITE_OPEN_URI shared-cache memory  | ready   | 30      |
| [pool-per-class-callback-registry](stories/pool-per-class-callback-registry.md)               | Per-class callback registry          | draft   | 15      |
| [p13-standalone-connection](stories/p13-standalone-connection.md)                             | P13 — StandaloneConnection           | blocked | 40      |
| [pool-pg-reconnect-loop](stories/pool-pg-reconnect-loop.md)                                   | PG reconnectBang retry loop          | blocked | 100     |
| [pool-allow-retry-forwarding](stories/pool-allow-retry-forwarding.md)                         | Forward allowRetry through execQuery | blocked | 25      |
| [pool-cached-find-by-statement-cache](stories/pool-cached-find-by-statement-cache.md)         | cachedFindBy + StatementCache        | blocked | 50      |
| [pool-merge-resolve-url-config-unskip](stories/pool-merge-resolve-url-config-unskip.md)       | Unskip 7 url-config tests            | blocked | 20      |
| [pool-node-sqlite-restore-verify](stories/pool-node-sqlite-restore-verify.md)                 | Verify node:sqlite restoreFromPath   | blocked | 20      |
| [pool-raw-connection-initialize-overload](stories/pool-raw-connection-initialize-overload.md) | Raw-connection initialize overload   | blocked | 200     |

### relation

| ID                                                                            | Title                             | Status | Est LOC |
| ----------------------------------------------------------------------------- | --------------------------------- | ------ | ------- |
| [rf1-fk-derivation-consolidation](stories/rf1-fk-derivation-consolidation.md) | RF1 — FK derivation consolidation | ready  | 60      |
| [rf3-inorderof-type-cast](stories/rf3-inorderof-type-cast.md)                 | RF3 — inOrderOf type cast         | ready  | 20      |
| [r3-reorder-test-alignment](stories/r3-reorder-test-alignment.md)             | R3 — reorder test alignment       | ready  | 20      |
| [belongsto-accessor-null-bug](stories/belongsto-accessor-null-bug.md)         | belongsTo accessor null bug       | ready  | 40      |

## Changelog

- 2026-05-29: initial RFC, migrated from the three trails gap docs
  (`associations-gap-plan.md`, `connection-pool-gap-plan.md`,
  `relation-gap-plan.md`).

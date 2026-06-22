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

## Stories

### associations

<!-- generated: stories table -->

| ID                                                                                                                                      | Title                                                                                                                    | Status  | Est LOC | Cluster         |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------- | ------- | --------------- |
| [route-where-assoc-missing-through-join-dependency](stories/route-where-assoc-missing-through-join-dependency.md)                       | Route where.associated/where.missing joins through JoinDependency/AliasTracker instead of the flat string ON-rebind path | draft   | 250     | —               |
| [through-scope-join-route-composite-and-residual-shapes](stories/through-scope-join-route-composite-and-residual-shapes.md)             | through-scope-join-route-composite-and-residual-shapes                                                                   | ready   | null    | —               |
| [af11-strict-loading-test-unblocks](stories/af11-strict-loading-test-unblocks.md)                                                       | AF11 — wire remaining strict-loading test stubs                                                                          | done    | 90      | associations    |
| [af12-preload-through-where-placement](stories/af12-preload-through-where-placement.md)                                                 | AF12 — fix through-WHERE placement in includes-only preload path                                                         | done    | 50      | associations    |
| [af5-eager-load-raise-semantics](stories/af5-eager-load-raise-semantics.md)                                                             | AF5 — distinguish raise-worthy eager_load errors from capability-gap fallbacks                                           | done    | 150     | associations    |
| [alias-joins-to-association-name](stories/alias-joins-to-association-name.md)                                                           | Alias JOINs to the association name (Rails parity) to enable self-join where-hash disambiguation                         | done    | 200     | —               |
| [apply-all-queries-default-scope-on-reload-and-update-columns](stories/apply-all-queries-default-scope-on-reload-and-update-columns.md) | Apply all_queries default scopes on reload/update_columns (route reload through \_findRecord + apply_scoping)            | done    | 120     | —               |
| [assoc-scope-polymorphic-through-alias](stories/assoc-scope-polymorphic-through-alias.md)                                               | Association-scope polymorphic-through alias coverage                                                                     | done    | 50      | associations    |
| [belongsto-accessor-null-bug](stories/belongsto-accessor-null-bug.md)                                                                   | Investigate belongsTo accessor returning null despite valid FK                                                           | done    | 40      | relation        |
| [collection-size-identity-reconciliation](stories/collection-size-identity-reconciliation.md)                                           | Collection size / add-to-target AR-id identity reconciliation                                                            | done    | 70      | associations    |
| [combined-mixed-all-queries-default-scope-on-create-update](stories/combined-mixed-all-queries-default-scope-on-create-update.md)       | Mixed all_queries/non-all_queries default scopes apply correctly on create+update (un-skip combined test)                | done    | 80      | —               |
| [counthasmany-through-join-count](stories/counthasmany-through-join-count.md)                                                           | countHasMany loads rows (loadHasManyThrough.length) for through assocs instead of COUNT(\*) over the JOIN                | done    | 15      | —               |
| [cp-unified-load-path](stories/cp-unified-load-path.md)                                                                                 | CollectionProxy — unify toArray/load to a single exec-queries path (Rails parity)                                        | done    | 150     | associations    |
| [dependent-dispatch-consolidation](stories/dependent-dispatch-consolidation.md)                                                         | Consolidate dependent-handling dispatch paths                                                                            | done    | 80      | associations    |
| [error-message-dead-code-hygiene](stories/error-message-dead-code-hygiene.md)                                                           | Inverse-of error wording + dead-code hygiene                                                                             | done    | 60      | associations    |
| [habtm-proxy-size-nondistinct](stories/habtm-proxy-size-nondistinct.md)                                                                 | HABTM collection proxy size() returns deduped count for non-distinct collections                                         | done    | 50      | associations    |
| [hmt-scope-join-aware](stories/hmt-scope-join-aware.md)                                                                                 | Make HMT scope() join-aware like Rails                                                                                   | done    | 15      | associations    |
| [hmt-self-ref-belongs-to-push](stories/hmt-self-ref-belongs-to-push.md)                                                                 | Self-referential belongsTo-source push for has_many :through                                                             | done    | 100     | associations    |
| [insert-all-scope-attribute-precedence](stories/insert-all-scope-attribute-precedence.md)                                               | insert_all: scope attributes must take precedence over row values                                                        | done    | 5       | relation        |
| [nested-through-remainder](stories/nested-through-remainder.md)                                                                         | Nested-through remainder (scope, default_scope, shared-source reset, HMT autosave)                                       | done    | 200     | associations    |
| [pf5-connection-handler-reaudit](stories/pf5-connection-handler-reaudit.md)                                                             | Re-audit 11 still-skipped connection-handler.test.ts tests                                                               | done    | 50      | connection-pool |
| [pool-env-resolution-unify](stories/pool-env-resolution-unify.md)                                                                       | Unify fromEnv currentEnv vs forCurrentEnv defaultEnv resolution                                                          | done    | 40      | connection-pool |
| [pool-merge-resolve-url-config-unskip](stories/pool-merge-resolve-url-config-unskip.md)                                                 | Unskip 7 merge-and-resolve-default-url-config tests                                                                      | done    | 20      | connection-pool |
| [pool-per-class-callback-registry](stories/pool-per-class-callback-registry.md)                                                         | Per-class clone-on-write callback registry on AbstractAdapter                                                            | done    | 15      | connection-pool |
| [pool-reap-flush-expire-audit](stories/pool-reap-flush-expire-audit.md)                                                                 | Audit \_available re-add sites that skip expire()                                                                        | done    | 25      | connection-pool |
| [pool-sqlite-open-uri](stories/pool-sqlite-open-uri.md)                                                                                 | Enable SQLITE_OPEN_URI for shared-cache :memory:                                                                         | done    | 30      | connection-pool |
| [r3-reorder-test-alignment](stories/r3-reorder-test-alignment.md)                                                                       | R3 — align the 3 reorder-replaces-existing-order tests to Rails                                                          | done    | 20      | relation        |
| [relation-includes-count-join-dependency](stories/relation-includes-count-join-dependency.md)                                           | Relation: count and count("\*") with includes must apply join dependency                                                 | done    | 30      | relation        |
| [rf1-fk-derivation-consolidation](stories/rf1-fk-derivation-consolidation.md)                                                           | RF1 — fold four derive_foreign_key reimplementations into one helper                                                     | done    | 60      | relation        |
| [rf3-inorderof-type-cast](stories/rf3-inorderof-type-cast.md)                                                                           | RF3 — add type_cast_for_database value casting in inOrderOf                                                              | done    | 20      | relation        |
| [strict-loading-cascade-proxy](stories/strict-loading-cascade-proxy.md)                                                                 | Strict-loading cascade on collection proxy reader + mode propagation                                                     | done    | 80      | associations    |
| [through-scope-join-not-in-subquery](stories/through-scope-join-not-in-subquery.md)                                                     | Through/HABTM proxy scope() uses id IN (subquery) instead of Rails' JOIN, deduping join-row multiplicity                 | done    | 80      | —               |
| [track9-single-test-gaps](stories/track9-single-test-gaps.md)                                                                           | Track 9 — scattered single-test association gaps                                                                         | done    | 110     | associations    |
| [unify-alias-tracker-across-join-buckets](stories/unify-alias-tracker-across-join-buckets.md)                                           | Unify AliasTracker across inner/left-outer/eager join buckets (one JoinDependency alias namespace)                       | done    | 200     | —               |
| [where-hash-resolves-self-join-alias](stories/where-hash-resolves-self-join-alias.md)                                                   | where({ assocName: {...} }) resolves to the self-join alias when the association is joined under an AliasTracker alias   | done    | 80      | —               |
| [where-nested-hash-assoc-name-table-resolution](stories/where-nested-hash-assoc-name-table-resolution.md)                               | where() nested-hash keyed by camelCase association name doesn't resolve to table                                         | done    | 80      | relation        |
| [d2-has-one-fixture-bodies](stories/d2-has-one-fixture-bodies.md)                                                                       | D2 — fill has_one test fixture bodies (~24 fixture-gated tests)                                                          | blocked | 200     | associations    |
| [p13-standalone-connection](stories/p13-standalone-connection.md)                                                                       | P13 — implement StandaloneConnection class                                                                               | blocked | 40      | connection-pool |
| [pool-allow-retry-forwarding](stories/pool-allow-retry-forwarding.md)                                                                   | Forward allowRetry through concrete execQuery overrides                                                                  | blocked | 25      | connection-pool |
| [pool-cached-find-by-statement-cache](stories/pool-cached-find-by-statement-cache.md)                                                   | Reconcile cachedFindBy with StatementCache and allowRetry                                                                | blocked | 50      | connection-pool |
| [pool-node-sqlite-restore-verify](stories/pool-node-sqlite-restore-verify.md)                                                           | Verify node:sqlite restoreFromPath on a Node 22.5+ CI lane                                                               | blocked | 20      | connection-pool |
| [pool-pg-reconnect-loop](stories/pool-pg-reconnect-loop.md)                                                                             | Port retry loop + raw-connection ownership to PostgreSQLAdapter#reconnectBang                                            | blocked | 100     | connection-pool |
| [pool-raw-connection-initialize-overload](stories/pool-raw-connection-initialize-overload.md)                                           | Port deprecated raw-connection initialize overload to base adapter                                                       | blocked | 200     | connection-pool |

## Changelog

- 2026-05-29: initial RFC, migrated from the three trails gap docs
  (`associations-gap-plan.md`, `connection-pool-gap-plan.md`,
  `relation-gap-plan.md`).

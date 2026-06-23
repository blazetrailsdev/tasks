---
rfc: "0031-schema-cache-always-warm-convergence"
title: "Schema cache always-warm convergence (sync columnsHash; remove synthesize + sibling-borrow)"
status: active
created: 2026-06-16
updated: 2026-06-16
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0031 — Schema cache always-warm convergence

## Summary

trails' synchronous `ModelSchema#load_schema` / `columnsHash()` path cannot do
what Rails does — hit the DB synchronously to reflect a cold table — because
every trails driver is async. trails papered over this with three non-Rails
mechanisms: a blanket per-test `schemaCache.clear()`, a
synthesize-`columnsHash`-from-`attribute()` fallback, and
`borrowSameTableColumns`. This RFC converges on Rails' **production** posture
instead of its dev cold-DB-hit: keep the schema cache **always warm and
persistent** so every sync read is served from a populated cache, clear
per-table on `reset_column_information` only, and drop the three workarounds.

## Motivation

Rails (`activerecord/lib/active_record/model_schema.rb`,
`connection_adapters/schema_cache.rb`):

- The `SchemaCache` is pool-scoped and **process-lifetime**; all same-table
  models share one entry and each applies its own `ignored_columns` at read
  time. `columns` / `columns_hash` are **purely DB-sourced** — a user
  `attribute :foo` that is not a real column never appears in `column_names`.
- `load_schema!` reads `schema_cache.columns_hash(table)`, hitting the DB
  **synchronously** when cold.
- `reset_column_information` clears **only that table**
  (`clear_data_source_cache!(table_name)`); transactional-fixtures teardown
  never blanket-clears.

trails diverges on four points, root-caused while attempting the
`columnshash-sync-schema-cache-reload-vs-sibling-borrow` story (PR #3445,
abandoned — see its Findings):

1. **Async-only reflection** — the irreducible one; PG/MySQL cannot introspect
   synchronously, so Rails' cold-DB-hit is impossible.
2. **Blanket per-test `schemaCache.clear()`** (`with-transactional-fixtures.ts`)
   — not Rails; wipes still-valid unchanged-table entries every test.
3. **Synthesize-`columnsHash`-from-attributes** (`model-schema.ts` `loadSchema`
   fallback) — Rails never derives `columns_hash` from `attribute()` for a
   table-backed model.
4. **`borrowSameTableColumns`** (`model-schema.ts`) — pure invention to recover
   columns synchronously after #2 wiped the cache; best-effort (returns null
   when every same-table sibling declares its own `ignoredColumns`).

PR #3445 proved that simply making the cache persistent (snapshot/restore _or_
DDL-keyed selective clear) breaks the suite deterministically on all three
adapters (`base.test.ts:2533/2664`, `calculations.test.ts:5283`,
`associations.test.ts:2738/2785`, `cache-key.test.ts:349`). Those tests define
ad-hoc model classes on **real** table names (`class Topic` / `class User` on
`topics` / `users`) and rely on #2 + #3 — a cold cache so `columnNames()`
synthesizes from declared attributes. Those assertions are themselves **not
Rails-faithful**: in Rails `User.column_names` on a real `users` table returns
the real columns. So convergence requires converging the tests too, which is
why this is an RFC, not a single story.

## Design

Adopt Rails' **always-warm** cache posture (its production model: a populated
`schema_cache.yml` / eager load), since the dev-time synchronous cold-DB-hit is
unavailable in an async stack.

1. **Pre-warm + persist (test harness + boot).** Eagerly populate the
   per-connection `SchemaCache` for all tables once after schema setup, so every
   sync `columnsHash()` read is warm. trails already has the primitives
   (`SchemaReflection.eagerLoadSchemaCache`, `loadAllBang`,
   `SchemaCache#addAll`); they default off. Turn them on for the AR test harness.
2. **Teardown clears per-table, not blanket.** Replace
   `withTransactionalFixtures`' blanket `schemaCache.clear()` with re-warming
   (or clearing) only the tables a test's DDL touched — the
   `clear_data_source_cache!(table_name)` shape — so unchanged-table entries
   survive (Rails parity) while DDL-rolled-back tables re-reflect.
3. **Drop synthesize for table-backed models.** `columnsHash()` / `loadSchema`
   stop deriving columns from `attribute()` when the model has a real table;
   keep synthesize ONLY for genuinely tableless attribute-only models (a
   trails-only ergonomic with no Rails analog). `attribute()` reverts to its
   Rails role: override a column's type or add a virtual attribute, never change
   column membership.
4. **Converge the divergent tests.** Rewrite the ad-hoc-model tests
   (`Topic`/`User`-on-real-table expecting attribute-synthesized columns) to
   Rails fidelity, each checked against its Rails counterpart. Most map to
   `test_clear_cache!`-style tests that use a real model and real columns.
5. **Delete `borrowSameTableColumns`** and its recovery test once reads are
   always warm.

## Alternatives considered

- **Synchronous driver introspection.** better-sqlite3 is sync, but PG/MySQL
  drivers are not — no uniform sync `columns()`. Rejected: SQLite-only, can't
  serve the abstract path.
- **Persist cache without pre-warming (PR #3445).** Snapshot/restore or
  DDL-keyed selective clear. Rejected: preserves warmth only for entries already
  present, leaves first-reads cold, and still breaks the cold-cache-dependent
  tests. The lesson: persistence without always-warm reads is not enough.
- **Ratify the divergence (keep borrow + synthesize).** Rejected per
  "always converge, never ratify" — the gap has a faithful resolution
  (always-warm), it is just larger than one PR.

## Rollout

Sequential; each story is independently shippable behind its dependency.

1. R1 — `r1-eager-persistent-schema-cache-test-harness`
2. R2 — `r2-drop-synthesize-converge-adhoc-model-tests` (deps: R1)
3. R3 — `r3-remove-sibling-borrow-and-recovery` (deps: R2)

## Open questions

1. **Production boot warming.** Should `eagerLoadSchemaCache` default on in
   trails apps, or stay opt-in (mirroring Rails apps choosing between a committed
   dump and live reflection)? Recommendation: stay opt-in for production; turn on
   only for the AR test harness in R1.
2. **Tableless attribute-only models.** Confirm which test models legitimately
   have no backing table (synthesize must stay for them) vs which collide with a
   canonical table (must converge). R2 enumerates them.

## Stories

R1 unblocks R2 unblocks R3. R1 must land green with synthesize + borrow still in
place (it only changes warming/teardown); R2 removes synthesize and converges
tests; R3 deletes borrow.

<!-- generated: stories table -->

| ID                                                                                                            | Title                                                                                          | Status | Est LOC | Cluster |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ | ------- | ------- |
| [remove-cold-cache-insert-reflection-fallback](stories/remove-cold-cache-insert-reflection-fallback.md)       | remove-cold-cache-insert-reflection-fallback                                                   | ready  | 60      | —       |
| [widen-writefromuser-strict-after-warm](stories/widen-writefromuser-strict-after-warm.md)                     | Widen writeFromUser to the Rails one-liner once the schema cache is warm at construction       | ready  | 120     | —       |
| [ddl-rename-column-index-invalidate-schema-cache](stories/ddl-rename-column-index-invalidate-schema-cache.md) | renameColumn/renameIndex must invalidate the schema cache (always-warm latent staleness)       | done   | 80      | —       |
| [r1-eager-persistent-schema-cache-test-harness](stories/r1-eager-persistent-schema-cache-test-harness.md)     | R1: eager-warm + persistent per-test schema cache in the AR test harness                       | done   | 150     | —       |
| [r2-drop-synthesize-converge-adhoc-model-tests](stories/r2-drop-synthesize-converge-adhoc-model-tests.md)     | R2: drop synthesize-from-attributes for table-backed models; converge ad-hoc-model tests       | done   | 250     | —       |
| [r3-remove-sibling-borrow-and-recovery](stories/r3-remove-sibling-borrow-and-recovery.md)                     | R3: remove sibling-borrow + recovery test once cache is always-warm                            | done   | 120     | —       |
| [remove-untyped-pk-parseint-cast-fallback](stories/remove-untyped-pk-parseint-cast-fallback.md)               | Remove \_castAttributeValue parseInt untyped-PK fallback once schema cache is always warm      | done   | 60      | —       |
| [schema-cache-custom-primary-key-inference](stories/schema-cache-custom-primary-key-inference.md)             | Schema cache should expose custom primary key for id:false tables (drop explicit \_primaryKey) | done   | 120     | —       |

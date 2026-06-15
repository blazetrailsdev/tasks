---
rfc: "0016-ar-test-compare-100"
title: "ActiveRecord test:compare 100%: phase-ordered un-skip campaign"
status: active
created: 2026-06-07
updated: 2026-06-07
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - hygiene
  - unblockers
  - clusters
  - adapter
  - integrated
  - core-residuals
---

<!-- Unnumbered until merge: keep `rfc:` as 0016-ar-test-compare-100. -->

# RFC 0016 — ActiveRecord test:compare 100%: phase-ordered un-skip campaign

## Summary

Drives `@blazetrails/activerecord` from **88.6%** (6959/7856, 890 skipped,
snapshot 2026-06-02) to 100%. Consolidates `workplan.md`,
`test-compare-100-attack-plan.md`, `activerecord-100-plan.md`, and
`activerecord-index.md`. Those four docs are deleted by `decommission-docs`
once this RFC's stories are merged.

Refresh before each story: `pnpm test:compare --cached --json --package activerecord`.

## Phase spine

```text
Phase 0  H-3: reclassify ~20 permanent skips (do first; shrinks denominator)
Phase 1  I-1: schema-dumper columnSpec U3 (gates ~60)
         I-2: enum cast (blocker; gates relation enum×5 + PG enum×5)
Phase 2  parallel clusters (CI-runnable on all three backends):
         F-1 insert_all (41) · F-2 pool (39) · F-3 migration (23) · F-4 transactions (47)
         F-5 query-cache (5) · F-6 nested-attrs (25) · F-7 fixtures (40) · F-8 core (29)
Phase 3  adapter type-families: PG (~94) + MySQL (~41)
         local-verify until RFC 0012 wire-adapter-dir-lane adds the CI lane
Phase 4  integrated tail: associations (265) + relation (170) — LAST, audit-gated
Phase 5  core-residuals: un-owned core skips surfaced after F-8 (#3012) closed —
         F-9a adapter (~44) · F-9b stmt-cache/binds (20) · F-9c quoting (15)
         F-9d autosave (11) · F-9e locking (11) · F-9f counter-cache (5) · F-9g tail (~50)
```

**Snapshot 2026-06-10:** `test:compare --package activerecord` = **92.6%**
(7241/7816, **575 skipped**). All 575 bucket into the phases above; Phase 5 captures
the ~175 core skips that F-8 (`f8-small-core-leftovers`, done #3012, scoped ~29) never
covered. `defaults_test.rb` (13, schema-dump defaults) stays under I-1.

**Adapter CI structure:** core + `adapters/sqlite3/**` run on all three backends
via `describeIfPg`/`describeIfMysql`. `adapters/postgresql/**` + MySQL dirs are
excluded from the shared run; need `TEST_ADAPTER=postgresql/mysql2` (RFC 0012).

## Deferred / permanent-skip

| Category             | Scope                                                                                                             | Action                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| YAML / Marshal       | `base.test.ts` (6), `schema-cache.test.ts` (2), assoc (5), `hstore.test.ts` (1)                                   | H-3 → `unported-files.ts`                    |
| Thread / fork        | `query-cache.test.ts` (4), `connection-pool.test.ts` (14), pool fork (5), `prepared-statement-status.test.ts` (1) | H-3 → `unported-files.ts`                    |
| Externally blocked   | `standalone-connection.test.ts` (4) — no `StandaloneConnection` in vendored Rails                                 | leave `it.skip`; re-open on snapshot refresh |
| Phase-G gated        | `nested-error.test.ts` (4), strong-params nested-assoc (2)                                                        | deferred to Phase G                          |
| Relation design gaps | `eager_load` toSql+STI (3); parameterized join strings R6c (2)                                                    | deferred; needs design                       |

## Stories

<!-- generated: stories table -->

| ID                                                                                                                      | Title                                                                                                       | Status      | Est LOC | Cluster        |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ------- | -------------- |
| [calculations-grouped-composite-fk-aggregate-coverage](stories/calculations-grouped-composite-fk-aggregate-coverage.md) | Cover sum/average/min/max for grouped composite-key belongs_to association                                  | ready       | 40      | —              |
| [persistence-dirty-pk-touch-reload-lock](stories/persistence-dirty-pk-touch-reload-lock.md)                             | Honor id_in_database in touch/reload/pessimistic-lock row targeting                                         | ready       | 90      | core-residuals |
| [persistence-query-constraints-where](stories/persistence-query-constraints-where.md)                                   | Route update/delete/destroy WHERE through \_query_constraints_hash                                          | ready       | 100     | core-residuals |
| [strict-loading-new-record-gate-in-loaders](stories/strict-loading-new-record-gate-in-loaders.md)                       | Gate strict-loading violation behind find_target? new-record check in functional loaders                    | ready       | 80      | —              |
| [timestamp-index-created-for-both-timestamps](stories/timestamp-index-created-for-both-timestamps.md)                   | timestamp: index is created for both timestamps (fixture-dependent)                                         | ready       | 30      | —              |
| [virtual-reconcile-warm-schema-cache](stories/virtual-reconcile-warm-schema-cache.md)                                   | Memoize schema cache when virtual reconciliation reflects on cold cache                                     | ready       | 40      | core-residuals |
| [base-test-connection-default-timezone](stories/base-test-connection-default-timezone.md)                               | base-test-connection-default-timezone                                                                       | claimed     | null    | —              |
| [base-test-copytable-readonly-includes](stories/base-test-copytable-readonly-includes.md)                               | base-test-copytable-readonly-includes                                                                       | claimed     | null    | —              |
| [adapter-select-all-accepts-relation](stories/adapter-select-all-accepts-relation.md)                                   | adapter-select-all-accepts-relation                                                                         | in-progress | 40      | —              |
| [adapter-select-all-accepts-arel](stories/adapter-select-all-accepts-arel.md)                                           | adapter-select-all-accepts-arel                                                                             | done        | 40      | —              |
| [array-where-integer-range-exclusion](stories/array-where-integer-range-exclusion.md)                                   | array-where-integer-range-exclusion                                                                         | done        | null    | —              |
| [calculations-aggregate-column-through-joins](stories/calculations-aggregate-column-through-joins.md)                   | calculations-aggregate-column-through-joins                                                                 | done        | null    | —              |
| [calculations-grouped-composite-fk-association](stories/calculations-grouped-composite-fk-association.md)               | Grouped calculation by composite-key belongs_to association                                                 | done        | 80      | —              |
| [columnnames-sync-virtual-exclusion](stories/columnnames-sync-virtual-exclusion.md)                                     | column_names sync introspection excludes virtual attributes (cold cache)                                    | done        | 120     | core-residuals |
| [f1-insert-all-cluster](stories/f1-insert-all-cluster.md)                                                               | F-1 — insert_all cluster                                                                                    | done        | 250     | clusters       |
| [f2-connection-pool-campaign](stories/f2-connection-pool-campaign.md)                                                   | F-2 — connection-pool / multi-db campaign                                                                   | done        | 250     | clusters       |
| [f3-migration-runner-campaign](stories/f3-migration-runner-campaign.md)                                                 | F-3 — migration runner campaign                                                                             | done        | 200     | clusters       |
| [f4-transactions-campaign](stories/f4-transactions-campaign.md)                                                         | F-4 — transactions + callbacks + touch                                                                      | done        | 250     | clusters       |
| [f5-query-cache-residuals](stories/f5-query-cache-residuals.md)                                                         | F-5 — query-cache residuals                                                                                 | done        | 50      | clusters       |
| [f6-nested-attributes](stories/f6-nested-attributes.md)                                                                 | F-6 — nested-attributes cluster                                                                             | done        | 200     | clusters       |
| [f6b-repair-validations-helper](stories/f6b-repair-validations-helper.md)                                               | F-6b — repair_validations test helper                                                                       | done        | 50      | clusters       |
| [f6c-nested-attrs-canonical-models](stories/f6c-nested-attrs-canonical-models.md)                                       | F-6c — migrate nested-attributes.test.ts to canonical Human/Interest models                                 | done        | 300     | clusters       |
| [f7-fixtures-backed-clusters](stories/f7-fixtures-backed-clusters.md)                                                   | F-7 — fixtures-backed clusters                                                                              | done        | 200     | clusters       |
| [f7b-adapter-model-comment-clusters](stories/f7b-adapter-model-comment-clusters.md)                                     | f7b-adapter-model-comment-clusters                                                                          | done        | 250     | clusters       |
| [f8-small-core-leftovers](stories/f8-small-core-leftovers.md)                                                           | F-8 — small core leftovers                                                                                  | done        | 250     | clusters       |
| [f9-adapter-core-behaviors](stories/f9-adapter-core-behaviors.md)                                                       | F-9a — adapter_test core behaviors                                                                          | done        | 400     | core-residuals |
| [f9-autosave-association](stories/f9-autosave-association.md)                                                           | F-9d — autosave_association residuals                                                                       | done        | 300     | core-residuals |
| [f9-bind-params-to-sql-and-join-subquery](stories/f9-bind-params-to-sql-and-join-subquery.md)                           | F-9b follow-up — bind_params_to_sql collector + bind-from-join subquery                                     | done        | 150     | core-residuals |
| [f9-core-misc-tail](stories/f9-core-misc-tail.md)                                                                       | F-9g1 — calculations + SQL-sanitization tail                                                                | done        | 300     | core-residuals |
| [f9-counter-cache-reset](stories/f9-counter-cache-reset.md)                                                             | F-9f — counter_cache reset variants                                                                         | done        | 180     | core-residuals |
| [f9-optimistic-locking-residuals](stories/f9-optimistic-locking-residuals.md)                                           | F-9e — optimistic locking residuals                                                                         | done        | 300     | core-residuals |
| [f9-quoting-and-typecast](stories/f9-quoting-and-typecast.md)                                                           | F-9c — quoting + type-cast edge cases                                                                       | done        | 200     | core-residuals |
| [f9-statement-cache-and-binds](stories/f9-statement-cache-and-binds.md)                                                 | F-9b — statement cache + bind parameters                                                                    | done        | 350     | core-residuals |
| [f9-statement-cache-pool-introspection](stories/f9-statement-cache-pool-introspection.md)                               | F-9b follow-up — statement-cache pool introspection + find-through-cache                                    | done        | 250     | core-residuals |
| [f9b-adapter-transaction-restore-residuals](stories/f9b-adapter-transaction-restore-residuals.md)                       | F-9b — adapter_test transaction restore/remote-disconnection (non-in-memory)                                | done        | 150     | —              |
| [f9c-adapter-exception-translation-refint](stories/f9c-adapter-exception-translation-refint.md)                         | F-9c — adapter_test exception translation + referential integrity (MySQL/PG)                                | done        | 170     | —              |
| [f9d-adapter-querycache-truncate-pkreset](stories/f9d-adapter-querycache-truncate-pkreset.md)                           | F-9d — adapter_test query-cache + truncate + pk-reset                                                       | done        | 150     | —              |
| [f9e-adapter-backend-introspection](stories/f9e-adapter-backend-introspection.md)                                       | F-9e — adapter_test backend introspection probes (MySQL/PG)                                                 | done        | 80      | —              |
| [f9g2-attributes-and-loading](stories/f9g2-attributes-and-loading.md)                                                   | F-9g2 — attributes + loading behavior tail                                                                  | done        | 300     | core-residuals |
| [f9g2-attributes-virtual-columns](stories/f9g2-attributes-virtual-columns.md)                                           | F-9g2 follow-up — virtual attributes (no DB column)                                                         | done        | 80      | core-residuals |
| [f9g2-inheritance-enum-sti-default-scope](stories/f9g2-inheritance-enum-sti-default-scope.md)                           | F-9g2 follow-up — enum-backed STI inheritance column dispatch                                               | done        | 120     | core-residuals |
| [f9g2-inheritance-of-first-firm-scope](stories/f9g2-inheritance-of-first-firm-scope.md)                                 | F-9g2 follow-up — of_first_firm join-scope inheritance fixtures                                             | done        | 60      | core-residuals |
| [f9g2-nested-attributes-immediate-build](stories/f9g2-nested-attributes-immediate-build.md)                             | F-9g2 follow-up — Rails-style immediate in-memory nested-attribute build                                    | done        | 120     | core-residuals |
| [f9g2-read-lazy-attribute-methods](stories/f9g2-read-lazy-attribute-methods.md)                                         | F-9g2 follow-up — lazy attribute-method generation (define_attribute_methods)                               | done        | 120     | core-residuals |
| [f9g2-sti-dispatch-at-new](stories/f9g2-sti-dispatch-at-new.md)                                                         | F-9g2 follow-up — STI dispatch at new() from type column                                                    | done        | 80      | core-residuals |
| [f9g2-strict-loading-association-build](stories/f9g2-strict-loading-association-build.md)                               | F-9g2 follow-up — strict-loading ignored on new-record association build/writer                             | done        | 120     | core-residuals |
| [f9g3-persistence-and-instrumentation](stories/f9g3-persistence-and-instrumentation.md)                                 | F-9g3 — persistence, instrumentation + single-skip tail                                                     | done        | 350     | core-residuals |
| [f9g3b-persistence-feature-gap-tail](stories/f9g3b-persistence-feature-gap-tail.md)                                     | f9g3b-persistence-feature-gap-tail                                                                          | done        | null    | —              |
| [f9g3b2-base-test-timezone-and-misc](stories/f9g3b2-base-test-timezone-and-misc.md)                                     | f9g3b2-base-test-timezone-and-misc                                                                          | done        | null    | —              |
| [f9g3b3-touch-later-association-propagation](stories/f9g3b3-touch-later-association-propagation.md)                     | f9g3b3-touch-later-association-propagation                                                                  | done        | null    | —              |
| [f9g3b4-finder-eager-load-collection-ordering](stories/f9g3b4-finder-eager-load-collection-ordering.md)                 | f9g3b4-finder-eager-load-collection-ordering                                                                | done        | null    | —              |
| [f9h-reserved-word-schema-assoc](stories/f9h-reserved-word-schema-assoc.md)                                             | F-9h — reserved-word change-columns / limited deleteAll / has_one reader                                    | done        | 250     | core-residuals |
| [f9i-calculations-grouped-assoc](stories/f9i-calculations-grouped-assoc.md)                                             | F-9i — calculations grouped-association + includes/offset tail                                              | done        | 200     | core-residuals |
| [f9j-reflection-join-table-includes](stories/f9j-reflection-join-table-includes.md)                                     | F-9j — reflection join_table derivation + includes-accepts-symbols                                          | done        | 120     | core-residuals |
| [h3-reclassify-permanent-skips](stories/h3-reclassify-permanent-skips.md)                                               | H-3 — reclassify permanent skips                                                                            | done        | 40      | hygiene        |
| [i1-schema-dumper-columnspec-u3](stories/i1-schema-dumper-columnspec-u3.md)                                             | I-1 — Epic 3.3-U3: schema-dumper columnSpec wiring                                                          | done        | 120     | unblockers     |
| [i2-enum-cast](stories/i2-enum-cast.md)                                                                                 | I-2 — type_for_attribute enum write-casting                                                                 | done        | 150     | unblockers     |
| [locking-belongs-to-inverse-stale-state](stories/locking-belongs-to-inverse-stale-state.md)                             | locking-belongs-to-inverse-stale-state                                                                      | done        | null    | —              |
| [locking-counter-cache-lock-version](stories/locking-counter-cache-lock-version.md)                                     | F-9e residual: lock_version bump on counter cache/increment/decrement/update_counters + polymorphic destroy | done        | 200     | core-residuals |
| [locking-counter-cache-touch-polymorphic](stories/locking-counter-cache-touch-polymorphic.md)                           | F-9e residual: lock_version bump on belongs-to counter cache touch + polymorphic destroy                    | done        | 200     | core-residuals |
| [locking-dirty-primary-key](stories/locking-dirty-primary-key.md)                                                       | F-9e residual: dirty primary key update/delete/destroy                                                      | done        | 150     | core-residuals |
| [numeric-data-bigdecimal-nan](stories/numeric-data-bigdecimal-nan.md)                                                   | numeric_data: BigDecimal NaN sentinel + 'NaN'::numeric serialization (PG)                                   | done        | 120     | —              |
| [p3-adapter-type-families](stories/p3-adapter-type-families.md)                                                         | P3 — adapter type-families (PG ~94 + MySQL ~41)                                                             | done        | 300     | adapter        |
| [p3-mysql-auto-increment](stories/p3-mysql-auto-increment.md)                                                           | P3 — MySQL auto-increment (4 skips)                                                                         | done        | 60      | adapter        |
| [p3-mysql-charset-collation](stories/p3-mysql-charset-collation.md)                                                     | P3 — MySQL charset/collation and check-constraint quoting (2 skips)                                         | done        | 40      | adapter        |
| [p3-mysql-explain-and-hints](stories/p3-mysql-explain-and-hints.md)                                                     | P3 — MySQL EXPLAIN and optimizer hints (4 skips)                                                            | done        | 60      | adapter        |
| [p3-mysql-set-and-enum](stories/p3-mysql-set-and-enum.md)                                                               | P3 — MySQL SET and ENUM types (4 skips)                                                                     | done        | 60      | adapter        |
| [p3-mysql-stored-procedures](stories/p3-mysql-stored-procedures.md)                                                     | P3 — MySQL stored procedures / multi-result (3 skips)                                                       | done        | 80      | adapter        |
| [p3-mysql-transactions-deadlock](stories/p3-mysql-transactions-deadlock.md)                                             | P3 — MySQL transactions, deadlock, lock-row delete (5 skips)                                                | done        | 100     | adapter        |
| [p3-mysql-unsigned-type](stories/p3-mysql-unsigned-type.md)                                                             | P3 — MySQL unsigned type (6 skips)                                                                          | done        | 80      | adapter        |
| [p3-mysql-virtual-column](stories/p3-mysql-virtual-column.md)                                                           | P3 — MySQL virtual column (2 skips)                                                                         | done        | 50      | adapter        |
| [p3-pg-array-and-misc](stories/p3-pg-array-and-misc.md)                                                                 | P3 — PG array and misc adapter (17 skips)                                                                   | done        | 200     | adapter        |
| [p3-pg-enum-no-oid-warning](stories/p3-pg-enum-no-oid-warning.md)                                                       | p3-pg-enum-no-oid-warning                                                                                   | done        | null    | —              |
| [p3-pg-enum-orm-and-schema](stories/p3-pg-enum-orm-and-schema.md)                                                       | P3 — PG enum ORM + schema-dump/load scoped to schemas (5 skips)                                             | done        | 200     | —              |
| [p3-pg-optimizer-hints-and-enum](stories/p3-pg-optimizer-hints-and-enum.md)                                             | P3 — PG optimizer hints and enum (10 skips)                                                                 | done        | 120     | adapter        |
| [p3-pg-referential-integrity-and-adapter](stories/p3-pg-referential-integrity-and-adapter.md)                           | P3 — PG referential integrity and adapter (10 skips)                                                        | done        | 150     | adapter        |
| [p3-pg-transactions](stories/p3-pg-transactions.md)                                                                     | P3 — PG transaction error types (10 skips)                                                                  | done        | 150     | adapter        |
| [savepoint-materialize-reentrancy](stories/savepoint-materialize-reentrancy.md)                                         | Fix re-entrant savepoint materialization (mutual autosave cycle) + un-skip Eye/Iris twice tests             | done        | 80      | —              |
| [view-insert-record-adapter-scope](stories/view-insert-record-adapter-scope.md)                                         | View: adapter-scope the over-broad UpdateableViewTest insert-record skip                                    | done        | 15      | clusters       |
| [w7-associations-relation-tail](stories/w7-associations-relation-tail.md)                                               | W7 — associations + relation tail (audit-gated)                                                             | done        | 300     | integrated     |
| [w7-named-inner-joins-fix](stories/w7-named-inner-joins-fix.md)                                                         | W7 — \_namedInnerJoins merger/scope fix                                                                     | done        | 60      | integrated     |

## Changelog

- 2026-06-10: add Phase 5 core-residuals (F-9a…F-9g) for the ~175 un-owned core skips surfaced after F-8 (#3012) closed; snapshot refreshed to 92.6% (575 skipped).
- 2026-06-08: decompose p3-adapter-type-families into 12 child stories (8 MySQL + 4 PG residual).
- 2026-06-07: initial RFC, migrated from `workplan.md`, attack-plan, 100-plan, index.

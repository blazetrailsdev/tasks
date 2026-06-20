---
title: "gate-wrong-gate-body-convergence"
status: ready
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-burndown` (RFC 0032). That story converged 31 of
47 `wrong-gate` mismatches by swapping adapter wrappers for `describeIfSupports`
/ `itIfSupports` feature gates where the TS body already ran on exactly the
adapters Rails' feature predicate selects. The remaining **16** cannot be
converged by a gate-only edit: Rails gates them by a **feature with no adapter
restriction** (or a different adapter set), but our TS port uses an
**adapter-specific body** (hardcoded `new PostgreSQLAdapter(PG_TEST_URL)` /
`new Mysql2Adapter(MYSQL_TEST_URL)`, or a `describeIfPg` wrapper), or the
convergence surfaces a real impl gap. Each needs a body rewrite to use the
current test connection generically (Rails' `:arunit` idiom) and/or an impl fix,
then verification across the pg+mysql(+sqlite) lanes.

Remaining `wrong-gate` tests (file :: test :: rails-gate vs ts-gate):

- migration.test.ts :: "changing columns" :: rails features=[bulk_alter] / ts adapters=[postgresql] (PG-bodied, under describeIfPg BulkAlterTableMigrationsTest)
- migration.test.ts :: "changing column null with default" :: same
- migration.test.ts :: "default functions on columns" :: rails features=[bulk_alter,text_column_with_default] / ts adapters=[postgresql]
- adapter.test.ts :: "advisory locks enabled?" :: rails features=[advisory_locks] / ts adapters=[mysql] (body hardcodes Mysql2Adapter; Rails uses lease_connection generically over pg+mysql)
- insert-all.test.ts :: "upsert all works with partitioned indexes" :: rails features=[insert_conflict_target,insert_on_duplicate_update,partitioned_indexes] / ts adapters=[postgresql] (needs 3-feature gate; runtime intersection is pg-only)
- schema-dumper.test.ts :: "schema dump expression indices escaping" :: rails adapters=[mysql] features=[expression_index] / ts adapters=[postgresql,sqlite] — KNOWN impl gap: MySQL 8 expression-index dump syntax (P-9 family) not emitted; expression_index feature deliberately excludes mysql in test-helpers/supports.ts.
- dirty.test.ts :: "partial insert off with changed composite identity primary key attribute" :: rails features=[identity_columns] / ts adapters=[postgresql] (under describeIfPg DirtyTest — move test out of the PG wrapper into an identity_columns feature gate)
- invertible-migration.test.ts :: "migrate revert add check constraint with invalid option" :: rails features=[check_constraints] / ts adapters=[postgresql,sqlite] (body skips mysql; check_constraints spans all 3 — verify/fix mysql revert path)
- adapters/abstract-mysql-adapter/connection.test.ts :: "passing arbitrary flags to adapter" :: rails adapters=[none] / ts adapters=[mysql] (Rails gate is the empty "runs nowhere" set — investigate why; likely a Trilogy-only / flags-specific guard)
- adapters/abstract-mysql-adapter/connection.test.ts :: "passing flags by array to adapter" :: same
- view.test.ts :: "insert record" :: rails adapters=[mysql,postgresql] features=[views] / ts features=[views]+unknown-guard (body skips mysql due to NO_AUTO_VALUE_ON_ZERO view-insert bug — fix then include mysql)
- view.test.ts :: "insert record populates primary key" :: rails adapters=[mysql,postgresql] features=[insert_returning,views] / ts adapters=[mysql,postgresql] features=[insert_returning] (needs views feature added alongside insert_returning; wrap UpdateableViewTest in describeIfSupports("views"))
- transaction-isolation.test.ts :: "read uncommitted" :: rails features=[transaction_isolation] / ts adapters=[postgresql] (under describeIfPg with PG_TEST_URL bodies — rewrite generic over the current adapter, gate transaction_isolation, exclude sqlite per Rails' !SQLite3Adapter)
- transaction-isolation.test.ts :: "read committed" :: same
- transaction-isolation.test.ts :: "repeatable read" :: same
- transaction-isolation.test.ts :: "serializable" :: same

## Acceptance criteria

- [ ] For each test above, rewrite the body to be adapter-generic (use the
      current test connection, not a hardcoded adapter URL) and/or fix the
      surfaced impl gap, then gate it so `adapterFeatureKey(ts)` exactly equals
      `railsGate` reported by `test:compare --package activerecord --gates`.
- [ ] Where an impl gap genuinely blocks an adapter (mysql expression-index
      dump; mysql view insert; mysql check-constraint revert), keep Rails' gate,
      mark the test pending with a BLOCKED note, and register a sub-story.
- [ ] `test:compare --package activerecord --gates` reports **0 wrong-gate** for
      activerecord.
- [ ] Test names unchanged.

## Notes

Test names match Rails verbatim. New `supports.ts` keys added in the parent PR:
`partitioned_indexes` (pg), `pgcrypto_uuid` (pg). The `connection.test.ts`
`adapters=[none]` case may be a Ruby-extractor artifact — verify against
vendor/rails/.../abstract_mysql_adapter/connection_test.rb before changing the
gate.

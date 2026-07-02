---
title: "Deterministic descending-index reconstruct for MariaDB schema-dumper sort-order tests"
status: done
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4397
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumperTest > "schema dumps index columns in right order"` and
`"schema dumps index sort order"` (packages/activerecord/src/schema-dumper.test.ts)
are **skipped for all adapters** as of PR #4397 — they flake on the MySQL/MariaDB
CI lane. Un-skip them once the reconstruct is deterministic.

**Symptom (flaky):** the canonical `companies` descending indexes
(`company_index` with `order: { rating: :desc }`, and
`index_companies_on_name_and_rating` with `order: :desc`, both from
`vendor/rails/activerecord/test/schema/schema.rb:417-419`) round-trip through the
shared-worker reconstruct **non-deterministically** on MariaDB — some CI runs
materialize them descending (dump renders `order:`), some ascending (no `order:`).

- Run 28557747147 (main): `Received: ...order: { rating: "desc" }` (descending).
- Run 28561820048 (PR #4397): `Received: ...` no order (ascending).
  Same reconstruct code both runs → non-determinism, a shared-DB shape-drift class.

**Rails-fidelity target.** Rails' `supports_index_sort_order?`
(`abstract_mysql_adapter.rb:100-102`) is `mariadb? ? >= "10.8.1" : >= "8.0.1"` —
already ported exactly (PR #4397, `abstract-mysql-adapter.ts:440-444`). On the CI
`mariadb:11.8` lane it is TRUE, so Rails DOES dump the descending `order:`. The
expectation helper `dumpsIndexSortOrder()` already consults the live adapter flag
(Rails-faithful). The remaining gap is the **reconstruct**, which must
deterministically create the descending index.

**Root cause (deviation).** Rails' `SchemaCreation` delegates the whole
`quoted_columns_for_index` to `@conn`
(`abstract/schema_creation.rb:16-21` `delegate ... :quoted_columns_for_index ...
to: :@conn`), so the sort-order gate always resolves to the adapter's
version-aware `supports_index_sort_order?` (via
`abstract/schema_statements.rb:1639 add_options_for_index_columns → if
supports_index_sort_order?`). trails **reimplements** the sort-order emission on
two divergent, inconsistent paths:

- `MySQL::SchemaCreation.quotedColumns` → the free `addOptionsForIndexColumns`
  (`mysql/schema-statements.ts:340`) is **ungated** — always applies `DESC`.
- the abstract `SchemaCreation.quotedColumnsForIndex`
  (`abstract/schema-creation.ts:286-308`) gates on a **static**
  `supportsIndexSortOrder()` = `adapterName !== "mysql"` (always false for
  MySQL) — drops `DESC`.
  Which path runs for a given `companies` reconstruct depends on worker/slot
  scheduling + which materialization "wins" the shared worker DB (globalSetup
  `defineSchema` vs per-file `loadSchema` / `reconstructFromSchema`), producing the
  flip.

Note: could not reproduce the flip in a single-file local harness — a
vitest-src vs dist module-realm split makes the local executed path differ from
CI's pure-`pnpm build` dist path. Verify fixes on CI (the mariadb:11 lane), not
just locally.

## Acceptance criteria

- The `companies` descending indexes reconstruct **deterministically** as
  descending on the MariaDB CI lane (SHOW KEYS `Collation = "D"`), so the dump
  reliably renders `order:`.
- Rails-faithful convergence: the SchemaCreation sort-order gate resolves to the
  adapter's version-aware `supportsIndexSortOrder()` on **every** path (mirroring
  Rails' `delegate :quoted_columns_for_index, to: :@conn`), removing the
  static `adapterName !== "mysql"` heuristic and the ungated-vs-gated split.
  Ensure the database version is warm before the gate is read on the reconstruct
  path (`SchemaStatements#addIndex` already primes it).
- Re-enable (un-skip) both `SchemaDumperTest` cases in
  `packages/activerecord/src/schema-dumper.test.ts`; they pass on
  sqlite/postgres/mariadb without renaming (test:compare matching).
- No regression to sqlite/postgres index dumps.

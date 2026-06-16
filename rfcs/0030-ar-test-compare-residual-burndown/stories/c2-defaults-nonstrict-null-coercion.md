---
title: "c2-defaults-nonstrict-null-coercion"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
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

`defaults_test.rb:256` `test_mysql_not_null_defaults_non_strict`
(`DefaultsTestWithoutTransactionalFixtures`, gated `current_adapter?(:Mysql2Adapter, :TrilogyAdapter)`)
remains `it.skip` in `packages/activerecord/src/defaults.test.ts` after RFC 0030
story `c2-defaults-expression-dump` (the 9 schema-dump tests and the strict-mode
sibling were un-skipped there).

The test builds a NOT NULL table on a non-strict connection
(`new Mysql2Adapter({ uri, strict: false })`), creates a blank record, saves it,
and asserts the NOT NULL columns coerce to `0` / `""` (MySQL non-strict
behaviour for _missing/omitted_ values).

The real blocker is a harness config divergence, **not** a DB engine quirk:

- MySQL **and** MariaDB both raise `ER_BAD_NULL_ERROR` (1048) for an _explicit_
  `NULL` into a NOT NULL column, regardless of strict mode. Non-strict mode only
  supplies an implicit default for _omitted_ columns, never for an explicit NULL.
- Rails' test suite runs with the framework default `partial_inserts = true`
  (`activerecord/lib/active_record/attribute_methods/dirty.rb:50`). So
  `klass.new` with no attributes set omits the NOT NULL columns from the INSERT
  entirely → the DB applies the implicit default → coercion to `0`/`""`.
- The trails harness loads `partial_inserts = false` (`load_defaults 7.0`, set in
  `packages/activerecord/src/test-setup-ar.ts`). Every column is named and explicit
  `NULL`s are sent → `ER_BAD_NULL_ERROR` on both MySQL and MariaDB alike.

The adapter's `strict: false` handling is correct (it removes
`STRICT_TRANS_TABLES`/`STRICT_ALL_TABLES`/`TRADITIONAL`, mirroring Rails
`mysql2_adapter.rb`); the convergence is at the `partial_inserts` layer, not the
strict-mode or engine layer.

## Acceptance criteria

- [ ] Run this one test under `partial_inserts = true` (Rails' actual test-env
      default) so the blank `new` record omits the NOT NULL columns from the
      INSERT, exactly as Rails does — e.g. scope the setting for the block and
      restore it, mirroring how Rails exercises this test.
- [ ] Un-skip `mysql not null defaults non strict` in `defaults.test.ts` and have
      it pass on the active MySQL-family CI lane (no `it.skip`).
- [ ] No deviation from Rails' assertions or the canonical table shape.

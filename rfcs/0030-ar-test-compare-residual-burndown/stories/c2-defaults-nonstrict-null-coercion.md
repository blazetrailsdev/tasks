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
behaviour for missing/invalid values).

Two interacting facts make it fail on our CI MySQL-family lane (MariaDB):

1. The test app runs `partial_inserts = false` (Rails 7.0 default, set in
   `packages/activerecord/src/test-setup-ar.ts:23`). A `new` record therefore
   INSERTs _explicit_ `NULL`s for every NOT NULL column.
2. MariaDB rejects an explicit `NULL` into a NOT NULL column with
   `ER_BAD_NULL_ERROR` even in non-strict mode (unlike MySQL, which coerces an
   explicit NULL to the implicit default in non-strict mode).

So the INSERT raises instead of coercing. The adapter's `strict: false` handling
is correct (it removes `STRICT_TRANS_TABLES`/`STRICT_ALL_TABLES`/`TRADITIONAL`,
mirroring Rails `mysql2_adapter.rb`); the divergence is MySQL-vs-MariaDB
non-strict explicit-NULL semantics combined with `partial_inserts = false`.

## Acceptance criteria

- [ ] Determine the convergence path: either (a) the suite should exercise this
      test only under real MySQL (mysql:8) rather than MariaDB, matching how
      Rails' own CI runs the MySQL/MariaDB lanes, or (b) confirm whether Rails
      relies on partial-insert omission here and align the trails behaviour.
- [ ] Un-skip `mysql not null defaults non strict` in `defaults.test.ts` and have
      it pass on the active MySQL-family CI lane (no `it.skip`).
- [ ] No deviation from Rails' assertions or the canonical table shape.

---
title: "A PostgreSQL bigserial primary key reflects as big_integer where Rails says integer"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Landed: `git grep big_integer origin/main -- packages/activerecord/src/connection-adapters packages/activerecord/src/reflection.test.ts` is empty — PG no longer reflects a bigserial PK as big_integer."
---

## Context

Rails' `columns_hash["id"].type` for a PostgreSQL `bigserial` primary key is
`:integer` — the PG adapter maps `int8` onto `ActiveRecord::Type::Integer` with
`limit: 8`, not onto a distinct big-integer type
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/...`,
and `reflection_test.rb:94-99` asserts `assert_equal :integer,
@first.column_for_attribute("id").type` with no adapter conditional).

trails names it `big_integer` instead, so the same read yields a different type
symbol on PostgreSQL (and likely MariaDB, whose default PK is `bigint`) than on
SQLite.

Surfaced by PR #7117, which converged `reflection.test.ts`'s `integer columns`
onto Rails' actual subject (`Topic`'s `id`) instead of a bespoke declared
attribute. That test currently accepts either spelling with a cite pointing
here; converging the type name lets it assert Rails' `integer` outright.

## Acceptance criteria

- [ ] A PG `int8` / MySQL `bigint` column reflects as Rails' `integer` type
      symbol, with the limit carrying the width.
- [ ] `reflection.test.ts`'s `integer columns` asserts `"integer"` on every
      adapter lane, with no either/or.
- [ ] activerecord suites green on all adapter lanes; parity deltas
      non-negative.

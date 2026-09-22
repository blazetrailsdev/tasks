---
title: "PostgreSQL case-insensitive test builds a bespoke table instead of canonical defaults"
status: draft
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `case_insensitive_test.rb` assertions in trails#7904.

Rails' `PostgresqlCaseInsensitiveTest` declares
`class Default < ActiveRecord::Base; end`
(`activerecord/test/cases/adapters/postgresql/case_insensitive_test.rb:6`), so it
runs against the **canonical `defaults` table**
(`activerecord/test/schema/schema.rb`, which already carries `char1`, `char2`,
`char3` and `multiline_default`), and reads its attributes through
`Default.arel_table[:char1]` (`:10-26`).

trails' port
(`packages/activerecord/src/adapters/postgresql/case-insensitive.test.ts`)
instead creates a bespoke `pg_case_insensitive_defaults` table in `beforeEach`
with an inline `CREATE TABLE`, and builds `new Arel.Table("pg_case_insensitive_defaults")`
by hand. That violates CLAUDE.md's "Canonical tables only — no bespoke tables"
rule: the table name is invented, the columns are re-declared inline, and no
model is involved.

trails#7904 converged the file's assertions (the 4 `assert_match` arms are now
unrolled to match `:12-26`) but deliberately left the table alone, since that is
a separate axis from the assertion parity the story owned.

## Converged shape

The test uses the canonical `defaults` table through the canonical loader /
`fixtures({ ... })` and a `Default` model on it, and reads
`Default.arelTable().get("char1")` — no `CREATE TABLE` in the test, no invented
table name.

## Acceptance criteria

- [ ] `case-insensitive.test.ts` no longer issues `CREATE TABLE` /
      `DROP TABLE` and no longer names `pg_case_insensitive_defaults`.
- [ ] It runs against the canonical `defaults` table with a `Default` model,
      mirroring `case_insensitive_test.rb:6-10`.
- [ ] `adapters/postgresql/case_insensitive_test.rb` stays at 0 assertion-count,
      -kind and -value mismatches in
      `pnpm parity:test -- --package activerecord --assertions`.

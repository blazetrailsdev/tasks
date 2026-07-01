---
title: "Converge AR DDL tests off canonical-table scratching and bespoke tables (Rails fidelity)"
status: done
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: 4367
claim: "2026-07-01T11:54:48Z"
assignee: "fidelity-audit-canonical-scratch-and-bespoke-tables"
blocked-by: null
---

# Converge AR DDL tests off canonical-table scratching and bespoke tables

**Self-contained fidelity work on `main`. No dependency on any branch, flag, or
`one-schema-exclude.json`.** Everything needed is below.

## Why (context)

Rails' migration/schema/adapter tests create their throwaway tables under names
that are NOT in `schema.rb` — `horses`, `testings`, `octopi`, etc. — and rely on
fixtures/canonical tables for everything else. A faithful trails port must do the
same. Several trails tests instead **scratch on canonical table names** (create or
drop `articles`, `users`, or a `CamelCase` table) or **invent bespoke tables**
(`chat_messages`) that Rails' `schema.rb` doesn't back with a canonical
declaration. That is a fidelity deviation on its own, independent of any test-mode
mechanism: a test that `create_table "articles"` is not mirroring the Rails test,
which scratches on `horses`.

(This audit was produced while trialing a no-`DROP TABLE` test mode; that mode is
parked and is NOT a prerequisite. The findings below are plain Rails-fidelity
defects — fix them on `main` regardless.)

## Findings — files that scratch canonical names or use bespoke tables

Direct `createTable`/`dropTable` on a CANONICAL table (rename scratch tables to
the Rails source's own non-`schema.rb` names):

- `schema-dumper.trails.test.ts` — `createTable("articles")`
- `migration.trails.test.ts`, `migrator.trails.test.ts`
- `schema-introspection.trails.test.ts`
- `adapters/mysql2/mysql2-adapter.trails.test.ts`
- `adapters/postgresql/postgresql-adapter.test.ts` — a `CamelCase` scratch table
  whose lifecycle assumes per-test recreation; mirror Rails' quoting test names
- adapter DDL suites still scratching canonical: `adapters/postgresql/active-schema`,
  `adapters/abstract-mysql-adapter/{adapter-prevent-writes,schema-migrations,schema}`,
  `adapters/mysql2/mysql2-adapter`, `migration`, `migrator`, `schema-dumper`

Bespoke tables not backed by canonical `TEST_SCHEMA`:

- `persistence.test.ts` — `chat_messages` (composite-PK). Rails' persistence test
  uses a real CPK fixture table; if Rails `schema.rb` declares it, add it to the
  canonical `TEST_SCHEMA` and ride it; otherwise mirror the actual Rails table. Do
  NOT keep an inline bespoke declaration.

## Acceptance criteria (all statically verifiable on `main` by reading the test)

- No test `createTable`/`dropTable`s a table whose name is in the canonical
  `TEST_SCHEMA`. Throwaway tables use the Rails source's own scratch names
  (`horses`/`testings`/…); the trails test name/table matches the Rails test.
- No inline/bespoke table declarations for tables Rails backs in `schema.rb` — add
  the missing table to canonical `TEST_SCHEMA` and ride it (e.g. `chat_messages`).
- Each converted file remains a faithful Rails port (names + assertions unchanged);
  `test:compare` does not regress.
- Split across PRs by file/sub-cluster under the 500-LOC ceiling; one file or
  sub-cluster per PR; do not stack.

## Permanent divergences (do NOT convert — record only)

`multiple-db.test.ts` (manages its own databases) and the `test-helpers/*`
self-tests (`define-schema`, `use-fixtures`, `use-transactional-tests`,
`with-transactional-fixtures`, `handler-resolved-adapter`) exercise the
`defineSchema`/fixtures machinery with intentionally bespoke tables — that is
their purpose. Leave them.

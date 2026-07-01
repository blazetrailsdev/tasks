---
title: "Rename canonical scratch tables in relocated .trails DDL tests (Rails fidelity)"
status: done
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 350
priority: 5
pr: 4367
claim: "2026-07-01T12:24:48Z"
assignee: "converge-relocated-trails-scratch-tables"
blocked-by: null
---

# Rename canonical scratch tables in relocated `.trails` DDL tests

**Self-contained fidelity work on `main`. No branch/flag/exclude-list
dependency.** This is the concrete `.trails` subset of
`fidelity-audit-canonical-scratch-and-bespoke-tables`.

## Why

The convergence PRs split trails-only cases out of the Rails ports into
`*.trails.test.ts`. Several of these do direct `createTable`/`dropTable` on
CANONICAL table names (`articles`, etc.). Rails' own migration/schema tests never
touch a `schema.rb` table as scratch — they use `horses`/`testings`. Reusing a
canonical name as scratch is a fidelity defect (and it double-creates/drops a real
table). Fix by renaming the scratch tables to non-canonical names.

## Files

- `packages/activerecord/src/schema-dumper.trails.test.ts` (creates `articles`)
- `packages/activerecord/src/migration.trails.test.ts`
- `packages/activerecord/src/migrator.trails.test.ts`
- `packages/activerecord/src/schema-introspection.trails.test.ts`
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts`

## Acceptance criteria (statically verifiable on `main`)

- No `createTable`/`dropTable` targets a table name present in the canonical
  `TEST_SCHEMA`; scratch tables use non-canonical names (prefer the Rails source's
  own, e.g. `horses`/`testings`).
- Each test creates AND drops its own scratch tables; touches no canonical table.
- Test names/assertions unchanged; `test:compare` does not regress.

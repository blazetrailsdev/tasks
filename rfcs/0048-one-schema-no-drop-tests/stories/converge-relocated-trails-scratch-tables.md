---
title: "Converge relocated .trails DDL tests to ride one-schema (scratch tables)"
status: blocked
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 350
priority: 5
pr: null
claim: null
assignee: null
blocked-by: "Gated on one-schema spike PR #4246 (draft, unmerged): eslint/one-schema-exclude.json and AR_ONE_SCHEMA infra exist only on that branch, not main. Unblock when #4246 lands."
---

# Converge relocated `.trails` DDL tests to ride one-schema

The convergence PRs split trails-only cases out of the Rails ports into
`*.trails.test.ts` files. Several of these relocated files scratch on CANONICAL
table names (`articles`, `CamelCase`, etc.) via direct `createTable`/`dropTable`,
so they fail under `AR_ONE_SCHEMA=1` (`relation "articles" already exists` /
`does not exist`) and are parked in `one-schema-exclude.json`. Their base port
stories are done, but nobody owns un-excluding these relocated cases.

Fix per the RFC convention: scratch tables MUST use non-canonical names (Rails'
`horses`/`testings`); a test must never create/drop a canonical table.

## Files (rename scratch tables off canonical, then drop from one-schema-exclude.json)

- `packages/activerecord/src/schema-dumper.trails.test.ts` (scratches `articles`)
- `packages/activerecord/src/migration.trails.test.ts`
- `packages/activerecord/src/migrator.trails.test.ts`
- `packages/activerecord/src/schema-introspection.trails.test.ts`
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts`

## Acceptance criteria

- Each file scratches only on non-canonical table names; never creates/drops a
  canonical table.
- Passes under `AR_ONE_SCHEMA=1` on all backends it runs on.
- Removed from `eslint/one-schema-exclude.json` as each lands.

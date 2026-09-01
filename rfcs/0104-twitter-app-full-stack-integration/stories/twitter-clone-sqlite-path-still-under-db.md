---
title: "examples/twitter-clone and database.test.ts still carry the pre-storage/ sqlite3 path"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7343 moved the generated sqlite3 database to `storage/<env>.sqlite3` in both
generators — `AppGenerator`'s `dbConfig`
(`packages/trailties/src/generators/app-generator.ts`) and
`db:system:change`'s `databaseConfigTs`
(`packages/trailties/src/generators/rails/db/system/change/change-generator.ts:241`)
— matching
`railties/lib/rails/generators/rails/app/templates/config/databases/sqlite3.yml.tt:14,21`,
which both Rails generators render
(`railties/lib/rails/generators/rails/db/system/change/change_generator.rb:37`).

Three hand-authored sites still carry the old `db/` layout and now disagree with
what `trails new -d sqlite` produces:

- `examples/twitter-clone/config/database.ts` and its `README.md:52,54`
- `examples/twitter-clone/.gitignore` (its `db/*.sqlite3` rules)
- `packages/trailties/src/database.test.ts`

`packages/activerecord-cli/src/init.ts:25-27` also emits `db/<env>.sqlite3`, but
that is the standalone-ActiveRecord `ar init` template, not the Rails app
generator, and a standalone AR app has no `storage/` directory — decide
explicitly whether it follows or stays.

## Converged shape

`examples/twitter-clone` reads as a freshly-generated app: its
`config/database.ts` names `storage/<env>.sqlite3`, its `.gitignore` covers the
database through a `/storage/*` block (`gitignore.tt:27-32`) with no separate
`db/*.sqlite3` rules, and its README matches. `database.test.ts`'s fixture paths
follow. `activerecord-cli`'s `init` template either follows or gets a one-line
note at the call site saying why the standalone CLI diverges.

## Acceptance criteria

- No `db/*.sqlite3` path remains in `examples/twitter-clone`.
- `examples/twitter-clone/.gitignore` covers the database through `/storage/*`.
- `packages/trailties/src/database.test.ts` uses the generated path.
- The `activerecord-cli` `init` decision is recorded one way or the other.

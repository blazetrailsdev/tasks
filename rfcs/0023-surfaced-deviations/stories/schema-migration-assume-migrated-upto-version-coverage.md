---
title: "schema-migration-assume-migrated-upto-version-coverage"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4873 (arel-raw-value-dispatch-raises-like-rails).

`SchemaMigration#assumeMigratedUptoVersion`
(`packages/activerecord/src/schema-migration.ts:199-206`) has **no test
coverage at all** — `git grep -l assumeMigratedUptoVersion` hits only
`schema-migration.ts`, `schema.ts` and
`connection-adapters/abstract/schema-statements.ts`, no test file.

That gap let a latent break ship unnoticed. The method built its rows as
`toInsert.map((v) => [new Nodes.Quoted(v)])` and fed them to
`createValuesList`. Once #4873 narrowed the ValuesList visitor to Rails'
`case` (`to_sql.rb:110` — only SqlLiteral/BindParam/ActiveModel::Attribute
are visited, everything else falls to `quote()`), a `Quoted` row reached
`quote()`, which raises `TypeError: can't quote Quoted`
(`abstract/quoting.ts:151`, mirroring `quoting.rb:86`). Verified through a
real SQLite adapter — the full 5155-test AR run stayed green throughout,
because nothing exercises this path.

PR #4873 fixed the row shape (rows now carry the version raw, as Rails does:
`create_version` passes it straight to `im.insert`, `schema_migration.rb:21`),
but did not add coverage — out of scope for that story.

Note Rails' `assume_migrated_upto_version` does not use Arel at all: it is
raw `execute insert_versions_sql(inserting)`
(`abstract/schema_statements.rb:1364-1383`). So there is a second question
here beyond coverage: whether the trails InsertManager construction should
converge to Rails' raw-SQL shape, or stay and simply be tested.

## Acceptance criteria

- [ ] `assumeMigratedUptoVersion` has tests covering: no-op when the version
      is already migrated, backfill of intervening versions (`v < version`),
      and the duplicate-migration raise Rails does
      (`schema_statements.rb:1377-1379` — check whether trails ports it).
- [ ] A test pins the emitted SQL shape, so a row-shape regression fails
      loudly rather than only at runtime:
      `INSERT INTO "schema_migrations" ("version") VALUES ('...'), ('...')`.
- [ ] Decide and record: converge to Rails' raw `insert_versions_sql`
      (`schema_statements.rb:1364-1383`) or keep the Arel construction with
      the Rails anchor documented.
- [ ] api:compare / test:compare delta non-negative.

---
title: "MigrationProxy#version is a string where Rails to_i's it in MigrationContext#migrations"
status: done
updated: 2026-08-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 100
pr: 6156
claim: "2026-08-06T14:43:07Z"
assignee: "ruby-time-carries-no-fractional-seconds"
blocked-by: null
closed-reason: null
---

## Context

Rails' `MigrationContext#migrations` coerces the parsed filename version with
`version = version.to_i` before building the proxy
(`vendor/rails/activerecord/lib/active_record/migration.rb:1310`), and
`get_all_versions` returns `schema_migration.integer_versions`
(`:1282-1287`). So every version a caller sees off a `MigrationContext` is an
Integer, and `Migrator#migrated`/`pending_migrations` compare Integers to
Integers (`:1471-1482`).

In trails, `MigrationProxy#version` is typed `string`
(`packages/activerecord/src/deprecator.ts:55,62`) and the `MigrationProxy`
interface in `migration.ts` declares `version: string` too, so the coercion
Rails does once inside `migrations` is pushed onto every consumer.
PR #5800 had to add it at the call site —
`connection-adapters/abstract/schema-statements.ts` `assumeMigratedUptoVersion`
does `migrationContext.migrations.map((m) => Number(m.version))` and
`(await migrationContext.getAllVersions()).map(Number)` — because without it
`migrated.includes(verNum)` compares `"3"` to `3` and never matches, silently
re-inserting an already-migrated version. Regression coverage for that is in
`schema-statements-assume-migrated-upto-version.trails.test.ts`.

Every other consumer of `MigrationProxy#version` is a candidate for the same
latent bug; the call-site coercion is a workaround, not the fix.

## Acceptance criteria

- [ ] Audit consumers of `MigrationProxy#version` and `getAllVersions` for
      string-vs-number comparisons that silently never match.
- [ ] Decide and apply the fix at the source: either type
      `MigrationProxy#version` as a number and coerce where the proxy is
      built (mirroring `migration.rb:1310`), or document why trails keeps the
      string and make the boundary explicit.
- [ ] Drop the call-site `.map(Number)` coercions in
      `assumeMigratedUptoVersion` once the source is fixed, keeping the
      existing string-version regression tests green.

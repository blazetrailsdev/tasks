---
title: "MigrationContext#migration_files skips emitted .d.ts files"
status: draft
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#migration_files` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/migration.rb:1367-1370`) globs `"#{path}/**/[0-9]*_*.rb"`. The trails port (`packages/activerecord/lib/migration.ts:1661-1664`) globs `[0-9]*_*.{ts,js}`, which also matches a `.d.ts` that tsc emits beside a compiled migration. An app built with `"declaration": true` then fails `db:prepare` from `dist/` with "Duplicate migration <version>", because `db/migrate/<v>_x.js` and `<v>_x.d.ts` parse to the same version. trails#10812 hit this and worked around it by dropping `declaration` from the generated `tsconfig.json.tt`. It also gave `Paths::Path#files_in` a `.d.ts` filter (`packages/trailties/lib/paths.ts`) for the same glob mismatch.

## Acceptance criteria

- `migrationFiles` returns no `*.d.ts`, so the glob's result matches Rails' `.rb`-only set: a migration is a code file only.
- A test: a `db/migrate` holding `1_a.js` and `1_a.d.ts` lists one migration and raises no `DuplicateMigrationError`.
- `scripts/generated-app-smoke.sh` keeps passing with `"declaration": true` restored in `tsconfig.json.tt`. Restore it if nothing else needs it dropped.

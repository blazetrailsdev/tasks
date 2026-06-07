---
title: "ar generate: reject illegal migration/model names"
status: in-progress
updated: 2026-06-07
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-generators-manifest"]
deps-rfc: []
est-loc: 10
priority: 54
pr: 2993
claim: "2026-06-07T14:08:17Z"
assignee: "cli-generator-name-validation"
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2717). Still live as of 2026-06-05.
Neither generator validates the name: `generateMigration`
(`generate-migration.ts:138`) only runs `normalizeSnakeName`
(`generate-migration.ts:50` — `underscore(name).replace(/[/\\]/g, "_")`) before
emitting, and `generateModel` (`generate-model.ts:59`) does the same. A name with
hyphens, leading digits, or other characters outside `[a-z0-9_]` flows straight
into the emitted class name via `camelize` (`renderMigration`,
`generate-migration.ts:126-127`) and the file path, producing uncompilable TS
with no guard.

Rails guards this in its migration generator: `validate_file_name!`
(`vendor/rails/activerecord/lib/rails/generators/active_record/migration/migration_generator.rb:65`,
called at `:16`) raises `IllegalMigrationNameError` unless the file name matches
`/^[_a-z0-9]+$/` (checked against the already-underscored `file_name`).

## Acceptance criteria

- [ ] `generate:migration` / `generate:model` reject names whose normalized form
      falls outside `/^[_a-z0-9]+$/` (e.g. hyphens, leading digits, namespace-only
      garbage) with a clear error, mirroring Rails' `validate_file_name!`
      (`migration_generator.rb:65`). Validate after `normalizeSnakeName`
      (`generate-migration.ts:50`), before any write.
- [ ] Field/model names that would emit uncompilable TS are rejected, not
      silently written (`renderMigration`/`renderModel` no longer receive a name
      `camelize` can't turn into a valid identifier).

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.

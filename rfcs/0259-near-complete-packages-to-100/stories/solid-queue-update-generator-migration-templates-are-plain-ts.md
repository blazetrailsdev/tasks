---
title: "SolidQueue::UpdateGenerator migration templates are plain .ts files"
status: in-progress
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: [solid-queue]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10781
claim: "2026-11-26T01:59:56Z"
assignee: "activesupport-api-remainder-reaches-100"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::UpdateGenerator#copy_new_migrations`
(`vendor/solid_queue/v1.7.2/lib/generators/solid_queue/update/update_generator.rb:13-18`)
globs `File.join(self.class.source_root, "db", "*.rb")` and takes
`File.basename(migration_file)` with one argument, because its migration
templates are plain `.rb` files. The port
(`packages/solid-queue/lib/generators/solid-queue/update/update-generator.ts`)
keeps them as `*.ts.tt` and strips the suffix with
`File.basename(migrationFile, ".tt")`. The method carries
`@missingRailsArgs basename` / `join — CONVERGEABLE` pointing here; it was
surfaced when red-65161fd9 added `lib/./generators` to solid_queue's
`extraLibPaths`.

## Acceptance criteria

- The migration templates live as `templates/db/*.ts`, the glob is
  `File.join(sourceRoot, "db", "*.ts")` and `basename` takes one argument.
- Both receipts are removed and `pnpm parity:api:calls:args` stays green.

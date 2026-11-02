---
title: "trailmap: type the stats-sync models with --schema db/statsSync_schema.ts=StatsSyncRecord"
status: draft
updated: 2026-11-02
rfc: "0136-trailmap"
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

trails#9618 added `--schema <path>=<Base>`. After a re-vendor past that merge, change trailmap's `build` script to add `--schema db/statsSync_schema.ts=StatsSyncRecord`.

Measured with the patched CLI: warnings fall from 25 to 6, and 6 type errors appear (app/models/stats-sync/pr-file.ts, lib/stats-sync/sync.ts, test/models/stats-sync-records.test.ts), from `PrFile`'s `changes` column colliding with `Base#changes`. Clear them with `stats-sync-renames-the-changes-column` or `@trails-typegen skip-columns: changes`. Re-vendor is its own PR.

## Acceptance criteria

- `pnpm build` passes with the scoped schema and the stats-sync models get generated types.
- Hand-written declares that the schema now supplies are removed.

---
title: "trailmap: configure Active Storage's Disk service on Base"
status: done
updated: 2026-11-19
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: storage
packages: ["activestorage"]
deps:
  [
    trailmap-bump-trails-for-activestorage,
    tasks-cli-migrates-audit-refinement-and-active-storage-tables,
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: trailmap#174
claim: "2026-11-19T03:21:38Z"
assignee: "trailmap-configures-active-storage-on-base"
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

`ActiveStorage::Record` is `Base`'s abstract subclass (trails
`packages/activestorage/lib/record.ts:5-7`), so the tables go on the primary
connection with no `connects_to`. That is Rails' default, and the operator
ruled `Base`. The 0123 WIP (trailmap 9ca1442) instead added `config/storage.ts`,
per-environment `activeStorage.service` lines, and the tables on **Hub**
(`db/hub-migrate/20261108000007_create_active_storage_tables.ts`,
`app/models/hub.ts` +12). Take the config files from it, but not the Hub
wiring.

`config/write-protocol.ts`'s `tableOwners` maps every table in
`db/schema.ts` to one writer, and `test/config/write-protocol.test.ts` holds
that rule. `storage/` is already a dokku storage mount (`config/database.ts`,
`queueEntry`'s note), so Disk blobs outlive a deploy.

## Acceptance criteria

- [ ] `config/storage.ts` declares `local` (Disk, `root: storage/blobs` or similar
      under the `storage/` mount) and `test` (Disk under `tmp/storage`).
      Production and development use `local`, and test uses `test`.
- [ ] `trails active_storage:install` writes the tables migration into
      `db/migrate` at the tasks twin's version. `db/schema.ts` gains the three
      tables.
- [ ] `tableOwners` gains `active_storage_blobs`, `active_storage_attachments`
      and `active_storage_variant_records` → `trailmap`.
- [ ] The `rails/` twin gets the same `config/storage.yml` and migration.
- [ ] A test attaches a string body to a throwaway record and downloads it
      back (this proves the 0189 fix is in the vendored build).

---
title: "trailmap: mirror the `stories.stage` migration"
status: draft
updated: 2026-11-14
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: []
deps: [tasks-session-stage-verb]
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trailmap and the tasks CLI share one migration history for `tasks.db`
(trailmap `config/database.ts`). trailmap's `/up` probe (`_checkMigrations`
in `app/controllers/probes-controller.ts`) compares the database head with
the last file in its `db/migrate` for EQUALITY, so a database AHEAD of
trailmap is red, as is one behind. `tasks-session-stage-verb` adds
`20261114000010_add_stage_to_stories`. trailmap needs the same file, deployed
in lockstep with the live `pnpm db:migrate` in the tasks repo, as was done
for `20261030000009_add_body_to_documents` (tasks#304, trailmap#99).

## Acceptance criteria

- [ ] trailmap's `db/migrate` carries `20261114000010_add_stage_to_stories.ts`,
      identical to the tasks repo's, and `db/schema.ts` gains the column.
- [ ] The trailmap deploy and the live `pnpm db:migrate` in the tasks repo
      happen together, and `/up` is green afterwards.

## Verification

- trailmap's probe test passes with the new head, and `/up` in production
  reports `expected` and `actual` both `20261114000010`.

## Notes

Only the migration. Reading `stage` into the page is
`fleet-session-reported-stage`, which can follow at any pace.

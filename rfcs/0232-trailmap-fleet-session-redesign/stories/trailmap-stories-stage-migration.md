---
title: "trailmap: mirror the `stories.stage` migration"
status: in-progress
updated: 2026-11-15
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: []
deps: [tasks-session-stage-verb]
deps-rfc: []
est-loc: 15
priority: null
pr: trailmap#141
claim: "2026-11-15T17:11:15Z"
assignee: "trailmap-stories-stage-migration"
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
- [ ] The PR is opened in trailmap and recorded on this story as
      `pr: trailmap#N` (`tasks in-progress`/`tasks done --pr trailmap#N`), so
      it closes the normal way.
- [ ] Lockstep order: run the live `pnpm db:migrate` in the tasks repo
      first, then deploy trailmap immediately. The column is additive, so
      the running trailmap reads `stories` unharmed while the database is
      ahead; the only red is `/up` reporting "ahead of this release" for the
      length of the deploy, which is acceptable. The reverse order is not:
      trailmap's deploy does not migrate `tasks.db` (`databaseTasks: false`),
      so a new trailmap would serve against a database missing a column its
      schema lists. `/up` is green once the deploy finishes.

## Verification

- trailmap's probe test passes with the new head, and `/up` in production
  reports `expected` and `actual` both `20261114000010`.

## Notes

Only the migration. Reading `stage` into the page is
`fleet-session-reported-stage`, which can follow at any pace.

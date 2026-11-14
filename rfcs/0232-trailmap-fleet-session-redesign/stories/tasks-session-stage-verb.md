---
title: "tasks: a `stage` verb and DB-owned field for a story's session stage"
status: in-progress
updated: 2026-11-14
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: tasks#344
claim: "2026-11-14T14:34:26Z"
assignee: "tasks-session-stage-verb"
blocked-by: null
---

## Context

The derived stage misses one transition, Drafting to Self review, which
only the agent knows (RFC open question 1, recommending this option). A story
gains a DB-owned `stage` field and a verb to set it, and trailmap reads it
with the story. This is tasks-repo work: `DB_OWNED` in `src/ingest.ts` and
the verbs in `src/cli.ts`.

## Acceptance criteria

- [ ] `tasks stage <id> <drafting|self>` sets a DB-owned `stage` column, and
      `stage` is in `DB_OWNED`, so ingest never reads it from markdown.
- [ ] `tasks show` prints it.
- [ ] Every status change except `blocked` and `claimed` clears it:
      `release` and a move to `draft`/`ready` (the claim goes),
      `in-progress` and `done` (the PR's facts take over), and `close`.

## Verification

- `pnpm test` in the tasks repo. `src/stage.test.ts` covers: ingest leaves
  `stage` untouched; `in-progress`, `done`, `release`, `draft`/`ready` and
  `close` each clear it; `blocked` keeps it.

## Notes

`packages` is empty because this story changes the tasks CLI, not a trails
package. The worker-prompt line is `btwhooks-stage-prompt-line`, and
trailmap's copy of the migration is `trailmap-stories-stage-migration`.

The live database is migrated by hand (`pnpm db:migrate`), not by merging.
Hold that run until `trailmap-stories-stage-migration` deploys: trailmap's
`/up` probe is red whenever the database head differs from its own.

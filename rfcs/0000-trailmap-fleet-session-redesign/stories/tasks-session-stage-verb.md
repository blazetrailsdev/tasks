---
title: "tasks: a `stage` verb and DB-owned field for a story's session stage"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
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
- [ ] `tasks show` prints it, and `tasks in-progress` and `tasks done`
      clear it.
- [ ] The worker prompt in btwhooks gains one line telling the agent to run
      `tasks stage <id> self` when it starts reviewing its own diff. That PR
      is opened in btwhooks and linked from this story's PR.

## Verification

- `pnpm test` in the tasks repo, with a test that ingest leaves `stage`
  untouched.

## Notes

`packages` is empty because this story changes the tasks CLI and the
btwhooks prompt, not a trails package.

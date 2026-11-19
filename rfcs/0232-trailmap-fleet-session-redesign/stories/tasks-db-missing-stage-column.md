---
title: "tasks: state verbs fail with unknown attribute 'stage' on the shared DB"
status: done
updated: 2026-11-19
rfc: "0232-trailmap-fleet-session-redesign"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After tasks #344 (`feat(cli): tasks stage, a DB-owned reported stage`) and #345, every state verb run from a trails worktree fails with
`error: unknown attribute 'stage' for Story.`:
`pnpm tasks in-progress fleet-session-card --pr trailmap#140` and `pnpm tasks done fleet-session-card fleet-top-panels-grid --pr trailmap#140` (2026-11-14).
The shared `.git/tasks.db` has no `stage` column (`select count(*) from pragma_table_info('stories') where name='stage'` → 0). So the CLI writes a column the live database never got. `/link` silently skips the in-progress stamp, so PRs go unstamped (`pr: null`), and the post-merge `done` fails.

## Acceptance criteria

- [ ] The shared tasks DB gains the `stage` column, through the CLI's own schema migration, not a hand `ALTER`.
- [ ] A CLI whose schema is newer than the DB migrates it or refuses with a message that names the missing migration, not `unknown attribute`.
- [ ] `fleet-session-card` and `fleet-top-panels-grid` are marked done with `--pr trailmap#140`.

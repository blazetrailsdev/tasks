---
title: "tasks CLI read sync (reset --hard origin/main) silently discards uncommitted worktree edits"
status: done
updated: 2026-06-22
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 3923
claim: "2026-06-22T20:51:16Z"
assignee: "tasks-cli-read-sync-discards-uncommitted-worktree-edits"
blocked-by: null
---

## Context

In symlink mode (`TASKS_DIR_IS_SYMLINK`, i.e. `pnpm tasks` run from a trails
worktree where `<cwd>/tasks` is the per-worktree symlink), **read** commands
sync the worktree to `origin/main` before loading the index by running
`git fetch` + `git reset --hard origin/main`
(`scripts/tasks/cli.ts`, the sync helper around the `TASKS_DIR_IS_SYMLINK`
freshness path). This is correct for serving non-stale data, but `reset --hard`
**silently discards any uncommitted changes in that worktree**.

This is a real data-loss footgun for an agent authoring story bodies in the
tasks worktree: writing `story.md` and then running any read (`pnpm tasks show`,
`list`, `status`, …) before committing wipes the unsaved edit with no warning.
Observed in practice while fleshing out draft-story bodies — a freshly written
body was lost to a subsequent `tasks show`.

## Acceptance criteria

- [ ] The pre-read `reset --hard origin/main` sync refuses (or stashes, or warns
      loudly and aborts) when the worktree has uncommitted changes, rather than
      silently discarding them — so a read can never destroy unsaved work.
- [ ] The freshness guarantee for a clean worktree is unchanged (still syncs to
      `origin/main` before loading the index).
- [ ] A test covers: read command + dirty worktree → no silent data loss
      (changes preserved or a clear abort), and read command + clean worktree →
      syncs as before.

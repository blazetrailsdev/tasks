---
title: "Move tasks.db out of the git common dir into trailmap's storage"
status: draft
updated: 2026-09-02
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-task-models-into-trailmap"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tasks.db` lives in the tasks repo's **git common dir** — `db-path.ts:71`
resolves it through `gitCommonDir()` so that every worktree, the CLI and the
btwhooks container all agree on one file. That indirection exists only because
several processes need to find the same database from different working trees.

With trailmap as the sole writer it stops being necessary, and the machinery
can go:

- `tasks/src/db-path.ts` — `gitCommonDir`, `resolveTasksDir`, `mainWorktree`,
  `enclosingTasksCheckout`, `resolveDbPath`.
- `webhook/tasksdb.go`'s hand-written mirror of the same logic in Go.

Move the database to trailmap's own persistent storage (a dokku storage mount,
matching how the app is deployed), and have trailmap open it by configured
path rather than by git archaeology.

This is a data move on a live database that the fleet reads continuously, so it
needs a rehearsal against a copy, a defined cutover, and a way back. Sequence
it with the API cutover: until the CLI talks HTTP, both it and trailmap must
still resolve the same file.

## Acceptance criteria

- `tasks.db` lives in trailmap's storage, opened by configured path.
- Its location survives a redeploy — verified by restarting the app and
  reading a known row.
- The move is rehearsed against a copy first, with the rollback written down.
- `db-path.ts`'s resolution helpers are deleted once nothing calls them.

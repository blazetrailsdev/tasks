---
title: "tasks CLI: serve the origin/main read index regardless of TASKS_DIR resolution"
status: claimed
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-25T15:38:44Z"
assignee: "tasks-read-index-ungated-from-symlink-check"
blocked-by: null
closed-reason: null
---

## Context

PR #5271 moved read commands (`ready`, `list`, `next-bundle`, `show`,
`status`) onto an index built from the `origin/main` tree, but gated it on
`TASKS_DIR_IS_SYMLINK` (`scripts/tasks/cli.ts:60`) — the gate the old
`syncFromOrigin()` used. So an agent with an explicit `$TASKS_DIR` (or the
`~/github/blazetrailsdev/tasks` canonical fallback) still gets
`readIndexSource()` → `loadIndex()`, i.e. whatever the working tree happens to
hold, with no freshness guarantee at all. Nothing about the origin/main tree
export needs the symlink: `buildIndexFromOriginMain(cwd)` already takes a cwd
and resolves its cache through `gitCommonDir()`.

That gate was correct for the old path (a `reset --hard` of a user's own
explicitly-chosen checkout would be hostile) but the new path mutates nothing,
so the reason for it is gone.

## Acceptance criteria

- Read commands serve the origin/main-tree index regardless of how `TASKS_DIR`
  resolved; only the fallback (`syncFromOrigin` + `loadIndex`) stays gated on
  `TASKS_DIR_IS_SYMLINK`, since it is the destructive one.
- A read against an explicit `$TASKS_DIR` never resets or dirties that checkout.
- `scripts/tasks/cli.test.ts` covers the non-symlink read path.

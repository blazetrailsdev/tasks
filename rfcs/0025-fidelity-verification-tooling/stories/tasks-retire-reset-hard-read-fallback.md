---
title: "tasks CLI: retire the reset --hard read fallback in favor of a stale-index warning"
status: ready
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`syncWorktreeToOrigin()` (`scripts/tasks/cli.ts:~590`) — fetch + `reset --hard
origin/main` under the tasks-CLI lock — is, after PR #5271, reachable only as
the read-path fallback when `buildIndexFromOriginMain()` returns null (offline,
no `tar`, no `node_modules` to borrow). It is the last place a _read_ can
mutate the shared canonical checkout, discard tracked edits, or contend on the
lock, and it carries a large share of the file's comment budget plus a five-test
suite for behavior that now almost never runs.

Offline reads can serve the working-tree index directly (`loadIndex()`) with a
"could not reach origin; index may be stale" warning — strictly less
destructive than a hard reset, and no less fresh, since offline means there is
nothing to sync to.

## Acceptance criteria

- The read path never calls `reset --hard`; the fallback degrades to
  `loadIndex()` plus a staleness warning.
- `syncWorktreeToOrigin` / `syncFromOrigin` and their tests are deleted if no
  caller remains (confirm the mutation path does not use them).
- Verify against a genuinely unreachable origin that reads still work.

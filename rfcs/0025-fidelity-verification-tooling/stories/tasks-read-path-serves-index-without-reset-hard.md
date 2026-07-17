---
title: "tasks CLI: serve reads from the origin/main tree — no reset --hard, no lock on reads"
status: draft
updated: 2026-07-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4778 closed the read-vs-mutation race by making `syncWorktreeToOrigin`
(`scripts/tasks/cli.ts`) take the tasks-CLI lock around its
`fetch` + `reset --hard origin/main`. That is correct but leaves reads and
mutations contending on one lock over the ONE shared canonical checkout:
reads block up to 20s behind a mutation (then give up and serve a stale
index with a "lock is busy" warning), and every read still mutates the
shared working tree via `reset --hard`.

Deeper fix: serve reads without touching the working tree at all. The index
(`index.json`, gitignored, rebuilt on demand by `loadIndex()` /
`scripts/build-index.mjs`) could be built from the `origin/main` **tree**
(`git fetch` + read blobs via `git show origin/main:<path>` or
`git archive`/temp export) instead of requiring the working tree to be reset
to origin/main. Then `reset --hard` disappears from the read path entirely,
the lock is only held by mutations, and stale-worktree agents (which still
run the old unlocked code until refreshed) stop being a hazard window.

## Acceptance criteria

- Read commands (`ready`, `list`, `next-bundle`, `show`, `status`) never run
  `reset --hard` (and ideally take no lock).
- Index freshness is preserved: reads reflect origin/main after a fetch.
- Mutation path unchanged; `scripts/tasks/cli.test.ts` sync suite updated.

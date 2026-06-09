---
title: "Serialize concurrent tasks-CLI mutations (file lock or per-agent worktree)"
status: draft
updated: 2026-06-08
rfc: "0001-task-system"
cluster: scaffold
deps: []
deps-rfc: []
est-loc: 100
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

All agents share one canonical `$TASKS_DIR` working tree, and `commitAndPush`
(claim / in-progress / done / priority / new) runs `pull --rebase` → `commit` →
`push` with no lock. Concurrent mutations serialize only by luck of the push
race: a loser retries a bounded number of times, then `process.exit(raceExitCode)`
and `reset --hard` discards the edit — so a claim or done can be silently dropped
under contention (observed repeatedly during the p3 decomposition work,
2026-06-08). PR #3047 fixed one cause (a wrong-branch bare-`main` push) but the
underlying unsynchronized shared tree remains.

## Acceptance criteria

- [ ] Concurrent `pnpm tasks` mutations from multiple agents never silently drop
      an edit — every mutation either lands or fails loudly with a distinct,
      non-race exit code.
- [ ] Implemented via a file lock around the pull/commit/push critical section,
      or per-agent worktrees pushing `HEAD:main` (as `refine` already does) so
      there is no shared-tree contention.
- [ ] Regression coverage for two concurrent mutations both landing.

## Notes

Surfaced as the "Follow-up" of PR #3047. The `refine` path already side-steps
this by committing in an agent worktree and pushing `HEAD:main`; generalizing
that to every mutation is one candidate fix.

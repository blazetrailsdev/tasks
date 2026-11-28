---
title: "trailmap-start-worktree-branch-reuses-tasks-checkout"
status: draft
updated: 2026-11-28
rfc: "0232-trailmap-fleet-session-redesign"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10866 fixed trails `scripts/start-worktree.sh`. Under `--branch`, when `refs/heads/tasks-$NAME` exists in the tasks canonical checkout, the script runs `git worktree prune` and then `git worktree add -B tasks-$NAME "$TASKS_WT" origin/main`, logging the discarded SHA, instead of falling back to the canonical checkout. trailmap's copy of `start-worktree.sh` still uses `-b` and falls back.

## Acceptance criteria

- [ ] trailmap's `start-worktree.sh`, under `--branch`, reuses an existing `tasks-<name>` branch the same way: prune, then `-B` reset to origin/main, and log the previous SHA.
- [ ] A trailmap test covers a respawn where `tasks-<name>` already exists and is ahead of origin/main.

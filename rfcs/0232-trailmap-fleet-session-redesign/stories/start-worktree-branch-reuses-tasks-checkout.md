---
title: "start-worktree --branch reuses an existing tasks-<name> checkout"
status: draft
updated: 2026-11-25
rfc: "0232-trailmap-fleet-session-redesign"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

`start-worktree.sh --branch` re-attaches an agent to an open PR whose worktree
was reaped. The reaped worktree's `tasks-<name>` branch in the tasks repo
usually survives, so `git worktree add -b tasks-<name>` fails and the agent
silently falls back to the canonical tasks checkout — the shared checkout the
per-worktree one exists to keep concurrent agents off.

Fix in trails `scripts/start-worktree.sh` first, then mirror in trailmap's.

## Acceptance

- Under `--branch`, an existing `tasks-<name>` branch is reused (reset to
  origin/main, after pruning any stale worktree registration) rather than
  falling back to canonical.
- A test in each repo covers a respawn where `tasks-<name>` already exists.
- Surfaced in review of trailmap#202.

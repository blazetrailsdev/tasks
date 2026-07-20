---
title: "Resolve suffixed worktree branch names to story ids in the link flow"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `/link` skill marks a story in-progress with
`pnpm tasks in-progress "$(git branch --show-current)" --pr "$PR"`, assuming the
branch name IS the story id. Worktrees created by `scripts/start-worktree.sh`
append a numeric suffix, so the branch is e.g.
`triage-value-accessor-read-surfaced-wide-baseline-8200` while the story id is
`triage-value-accessor-read-surfaced-wide-baseline`. The lookup fails with
`story "...-8200" not found in index` and the story silently stays un-started.

Observed on PR #4997; worked around by running `pnpm tasks in-progress` by hand
with the bare story id.

## Acceptance criteria

- The link flow resolves a suffixed worktree branch to its story id (strip a
  trailing `-<digits>` and retry, or resolve via the tasks index).
- Still a no-op for genuinely untracked branches — it must never block linking.

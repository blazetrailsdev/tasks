---
title: "ringo: spawn a credential-less review agent that drafts, never posts"
status: draft
updated: 2026-11-19
rfc: "0000-external-contributor-prs"
cluster: external-review
packages: []
deps: [ringo-classify-pr-trust-closed-by-default]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The existing review path gives the agent a write-capable `gh`. An external
PR's review must be drafted by an agent that cannot write to GitHub and does
not run the contributor's code.

## Acceptance criteria

- `POST /external-review/start {repo, pr, focus}` creates a worktree at
  `refs/pull/<n>/head` and spawns Claude with a read-only GitHub token (or no
  token, as the RFC's open question settles it). An agent constraint also
  forbids `gh pr review|comment|merge` and running scripts from the PR.
- The prompt marks the PR body, commits and discussion as untrusted data.
- The agent writes `review-draft.json` (`summary`, `event`, `comments[]` of
  `{path, line, side, body, rationale}`) and POSTs it to trailmap's
  `/api/external-reviews`. The session is parked, not discarded, so it can be
  resumed for a redraft.
- A Go test asserts the spawned pane's environment has no write-capable
  token.

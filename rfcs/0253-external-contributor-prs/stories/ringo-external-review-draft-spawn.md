---
title: "ringo: spawn a credential-less review agent that drafts, never posts"
status: ready
updated: 2026-11-20
rfc: "0253-external-contributor-prs"
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
  `refs/pull/<n>/head` and spawns Claude with `GH_TOKEN` set from
  `EXTERNAL_REVIEW_GH_TOKEN`: an owner-provisioned fine-grained PAT,
  read-only (`contents`, `pull_requests`, `metadata`), stored only in ringo's
  env file. The endpoint answers 503 when it is unset. An agent constraint also
  forbids `gh pr review|comment|merge` and running scripts from the PR.
- The prompt marks the PR body, commits and discussion as untrusted data.
- The agent writes `review-draft.json` (`summary`, `event`, `comments[]` of
  `{path, line, side, body, rationale}`); ringo stores it, serves it at
  `GET /api/external-reviews?repo=&pr=` and emits `external_review.drafted`
  on `/events`. The session is parked, not discarded, so it can be
  resumed for a redraft.
- Go tests assert the pane's `GH_TOKEN` is the read-only PAT (never the
  owner's token), and that a written draft is served by the GET and
  announced on `/events`.

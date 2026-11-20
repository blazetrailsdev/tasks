---
title: "ringo: one PR trust check, closed by default, on every PR-scoped handler"
status: draft
updated: 2026-11-19
rfc: "0000-external-contributor-prs"
cluster: trust-gate
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`prAuthorAllowed` (`webhook/handler.go:696`) returns true when
`ALLOWED_PR_AUTHORS` is empty, and it is called separately in six handlers.
`handleCheckRun`, `handleWorkflowRun`, `handlePRBodyEdited`, the CI fixer, the
merge sweep and the reviewer nudge have no author check. It also does not
detect forks.

## Acceptance criteria

- `classifyPR` returns `trusted` only when the author's login is in
  `TRUSTED_PR_AUTHORS` (`ALLOWED_PR_AUTHORS` is read as an alias, with a
  deprecation log line) and the head repo is the base repo. With an empty
  list, every PR is `external`.
- Every PR-scoped entry point returns early for `external` before any `gh`
  write, reviewer assignment, Copilot request, pane spawn or pane send.
- Exemption: `handleMerge` on an external PR still runs local bookkeeping
  (story `done`, worktree cleanup) and makes no `gh` writes.
- A table-driven Go test sends an external payload to every PR-scoped handler
  and asserts zero side effects (for `handleMerge`: bookkeeping only, zero
  `gh` writes). A trusted payload still assigns a reviewer
  (one handler is enough to cover this).
- A review or comment from an external login on a trusted PR is not
  delivered to the PR's agent pane.
- A test pins that only reviews by trusted logins count as approvals or
  change requests (ringo reads no verdicts today; the test guards any
  future merge gate).
- The PR notes the manual check of GitHub's "Require approval for all
  external contributors" Actions setting on each tracked repo.

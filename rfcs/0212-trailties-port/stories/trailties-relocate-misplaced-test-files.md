---
title: "Move trailties' 144 misplaced test files to their Rails paths"
status: closed
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-layout
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9565
claim: "2026-11-01T03:25:05Z"
assignee: "trailties-relocate-app-generator-to-rails-path"
blocked-by: null
closed-reason: "FALSIFIED: a body-unchanged move reds the assertion ratchet; replaced by trailties-move-tests-converging-assertions"
---

## Context

`pnpm parity:test --package trailties` reports 144 misplaced test files
(2026-10-30). A misplaced test is not credited to its Rails file.

## Acceptance criteria

- Every misplaced test moves to the path parity:test expects, with no change
  to test names or bodies (CLAUDE.md: never rename tests).
- parity:test reports 0 misplaced for trailties, or the PR body lists each
  remaining one and why.
- A split across two PRs is fine if the rename count is unreviewable. File the
  second half as a new story.

---
title: "Spawn a daily end-to-end fleet canary"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["add-a-write-canary-for-the-claim-path", "render-the-smoke-history-page"]
deps-rfc: []
est-loc: 400
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Every other tier can be green while the fleet is dead. The product is "a story
becomes a merged PR without a human in the loop", and the only proof of that is
doing it.

This is also the only tier that spends money and touches GitHub, which is why
it is last and behind a flag. RFC open question 1 is part of this story: price
it from the session-cost index before turning it on.

## Acceptance criteria

- [ ] A daily run claims a reserved no-op story, spawns one agent, and asserts
      the pane appeared, a PR opened, and the worktree was torn down
- [ ] The run is behind a flag that is off by default
- [ ] Its cost is measured from the session-cost index and recorded on the
      history page
- [ ] A stuck run cannot leave a pane, worktree, branch or claim behind
- [ ] The canary's PR is closed rather than merged, and is excluded from the
      spawn cap and every throughput count
- [ ] The estimated daily cost is stated in the PR description

## Definition of done

A canary that leaves cleanup to the existing sweeps does not close this story —
it asserts its own teardown.

## Verification

Two consecutive daily runs leave no residue: no extra pane, worktree, branch,
open PR or claim, and the history page shows both runs with their cost.

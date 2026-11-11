---
title: "trailmap: the stepper branches into an agent and reviewer loop at Reviewer convergence"
status: draft
updated: 2026-11-11
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-session-card]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "The review loop" replaces the current-stage icon at Reviewer
convergence with a ring: the agent on top, the reviewer below, the round
(`reviewCycles`) in the middle, and a line for each side's activity, from
the worker's `lastAction` and the reviewer entry's `pane_status` and
`review_owed`.

## Acceptance criteria

- [ ] At Reviewer convergence the current step renders the ring; every other
      stage, and a finished review, keeps the plain icon.
- [ ] Whose turn it is follows the RFC's rule (the working side, else the
      reviewer while `review_owed`, else the agent), as a pure function with
      a test per branch.
- [ ] The active side is filled, and the arc animates only while a side is
      working and never under `prefers-reduced-motion`.
- [ ] The ring carries one `aria-label` with the round and both lines.
- [ ] At 390px the activity lines do not widen the page.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` and
  `./scripts/dashboard-e2e.sh` at 1440 and 390 wide.

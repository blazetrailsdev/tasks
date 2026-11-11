---
title: "trailmap: a stalled session offers a message that names its next step"
status: draft
updated: 2026-11-11
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-session-card, fleet-session-composer]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "Stalls" defines a stalled session (its worker pane idle for the
threshold, short of its next stage) and four rules, each with the message
the button sends through `fleet/pane/:id/send`. Today's bulk
`/poke-stalled` control stays.

## Acceptance criteria

- [ ] trailmap records when each pane's `pane_status` last changed, and a row
      is stalled once it has been idle for the threshold (a named constant,
      15 minutes to start; RFC open question 6).
- [ ] `sessionStall(row, now)` in `fleet-format.js` is a pure function that
      returns the RFC table's rule, or nothing. A row with an open question
      is never stalled.
- [ ] A stalled row shows "Stalled · idle Nm", the evidence (met conditions
      ticked, the unmet one plain) and one button labelled with the message,
      with `aria-label="Message the agent: <message>"`.
- [ ] The button sends the message to the worker pane and nothing else; it
      does not change the PR.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js`: each rule fires on its
  fixture and not on its neighbours, below and above the threshold.
- `./scripts/dashboard-e2e.sh` asserts the button posts to the pane's send
  route.

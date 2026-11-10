---
title: "trailmap: order sessions by stage, pin the stage header, fold merged PRs"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-session-card]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`repoSections(prs, spawns)` (`app/assets/javascripts/fleet-format.js:1393`)
groups rows per repo in ringo's order. Merged PRs linger until pane teardown
(`teardownAt`, `cleanupPending`, `:913`). The RFC's "The session list"
describes the stage order, the one pinned stage header and the "Merged"
line.

## Acceptance criteria

- [ ] Within each repo, sessions are ordered by `sessionStage`, Drafting
      first, with ties kept in ringo's order.
- [ ] Merged sessions fold into one "Merged" line at the end of their repo:
      each PR link and lead story with its `lastTime`. The line disappears
      when ringo drops the last one.
- [ ] One stage header above the list, pinned while scrolling, names the
      six stages with their icons in columns aligned with the card steppers,
      at every width above 700px.
- [ ] The repo header shows one count: active sessions.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` for the ordering and folding, and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) for the header's column
  alignment (each header icon's center within 2px of the first card's
  matching step).

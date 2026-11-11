---
title: "trailmap: the CI fixer as a marked session row"
status: draft
updated: 2026-11-11
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-session-card, fleet-session-grouping]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fixerCards` (`app/assets/javascripts/fleet-format.js:272`) renders the fixer
into `#ciFixerPanel`. The RFC's "The CI fixer as a session" makes it a row in
its repo's list.

## Acceptance criteria

- [ ] Each fixer entry renders as a session row in its repo, joined to its
      worker's spawn or PR row by `story_id` or `pr`, or as a Drafting row
      with no PR when neither exists yet.
- [ ] The row is tinted, carries a "CI fixer" label beside a "main is red"
      flag, and sorts first in its repo whatever its stage.
- [ ] Its note carries the phase, the red checks and the red commit link
      `fixerCards` shows today.
- [ ] `#ciFixerPanel` is removed; the main CI pill links to the fixer row.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` (joined by story, by PR,
  and unjoined) and `./scripts/dashboard-e2e.sh`.

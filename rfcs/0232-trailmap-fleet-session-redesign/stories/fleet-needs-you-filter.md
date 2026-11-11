---
title: "trailmap: All and Needs you filter chips on the session list"
status: draft
updated: 2026-11-11
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-session-question, fleet-session-stall]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "The session list" adds two chips beside the stage header: All,
and Needs you, which keeps the rows with an open question, a failed check, a
stall or a merge waiting.

## Acceptance criteria

- [ ] Each chip shows its count and carries `aria-pressed`.
- [ ] Needs you hides every other row, the Merged line, and any repo left
      with no row; the CI fixer row is not counted (RFC open question 5).
- [ ] `?filter=needs` opens the page filtered.
- [ ] The counts and the filter update as frames arrive.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` (the predicate) and
  `./scripts/dashboard-e2e.sh` (chip, URL and empty-repo cases).

---
title: "trailmap: render each PR or spawn as a session card with a stage stepper"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-palette-tokens, fleet-session-stage]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`renderRepoSections` (`app/assets/javascripts/dashboard.js:107`) renders
`prRow` (`fleet-format.js:928`) and `spawnRow` (`:864`). The RFC's "The
session list" describes the card: PR link, title, note (`lastAction`), age
(`lastTime`), a six-icon stepper, and a colored edge for the stage. Merge sits
on Ready to merge cards (open question 3).

## Acceptance criteria

- [ ] `sessionCard(row, …)` in `fleet-format.js` replaces `prRow` and
      `spawnRow` in `renderRepoSections`. It is a pure function with unit
      tests, as `prRow` is today.
- [ ] The card shows the PR link (or "no PR yet"), the title, the note, the
      age and the stepper. Its stage is not repeated as a chip.
- [ ] The stepper draws each stage's icon in one of three shapes (current,
      done, to come) and carries `aria-label="Stage: <name>"`.
- [ ] Merge is on Ready to merge cards only.
- [ ] Until `fleet-session-detail` lands, the card keeps today's other row
      controls inline: the worker and reviewer pane lines, cleanup and
      queued notifications (`queuedUnder`).
- [ ] `prRow`'s existing tests are kept or rewritten against `sessionCard`,
      and none is dropped without a replacement.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job), which asserts every row control by selector.

## Notes

RFC 0136's `server-render-the-dashboards-pr-rows` takes `prRow`'s tests as
the specification for a server partial. Update that story's Context in this
PR to name `sessionCard`'s tests instead.

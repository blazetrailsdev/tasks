---
title: "trailmap: session cards grouped by repo, ordered by stage, with a stage header"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-palette-tokens, fleet-session-stage]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`renderRepoSections` (`app/assets/javascripts/dashboard.js:107`) renders
`repoSections(prs, spawns)` (`fleet-format.js:1393`) as PR and spawn rows. The
concept (trailmap#136, `b-stepper-list.html`) renders one card per session:
the PR link, the lead story, a note (`lastAction`), the age, a six-icon
stepper, and a colored edge for the stage. One sticky stage header above the
list names the stages. Merged sessions fold into one "Merged today" line per
repo.

## Acceptance criteria

- [ ] Each repo section lists its sessions ordered by `sessionStage`,
      Drafting first, with merged sessions on one "Merged today · N" line.
- [ ] Each card shows the PR link (or "no PR yet"), the title, the note, the
      age and the stepper. Its stage is not repeated as a chip.
- [ ] One stage header, pinned while scrolling, aligns its six columns with
      the card steppers.
- [ ] Today's row controls stay reachable: the worker and reviewer pane
      lines, cleanup and queued notifications (`queuedUnder`) move into the
      expanded card, and merge stays on Ready to merge cards, beside the PR
      link (RFC open question 3).
- [ ] The repo header shows one count: active sessions.
- [ ] The card renderer is a pure function in `fleet-format.js` with unit
      tests, as `prRow` is today.
- [ ] The dashboard e2e passes, with updated selectors.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job).

## Notes

RFC 0136's `server-render-the-dashboards-pr-rows` takes `prRow`'s tests as
the specification for a server partial. Once this lands, that story's
specification is the session card's tests instead. Say so in the PR body,
and update that story's Context in the same PR.

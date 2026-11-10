---
title: "trailmap: session cards grouped by repo, ordered by stage, with a stage header"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: []
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
- [ ] Today's row controls (merge, cleanup, the worker and reviewer pane
      lines, queued notifications from `queuedUnder`) stay reachable from the
      card.
- [ ] The repo header shows one count: active sessions.
- [ ] The dashboard e2e passes, with updated selectors.

---
title: "The Loop panel's buttons are sentence case, and their labels stop doubling as control values"
status: done
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#148
claim: "2026-11-16T22:21:26Z"
assignee: "command-palette-footer-hints-follow-the-mode"
blocked-by: null
closed-reason: null
---

## Context

`docs/style-guide.md` asks for sentence-case button labels. The Loop panel's
buttons are still lower case: `app/assets/javascripts/fleet-format.js:600`
(`label: "play"`), `:603` (`"spawn now"`), `:607` (`"skip"`), and the toggle's
text from `spawnLoopView` at `:660` (`toggle: s.enabled ? "pause" : "play"`).
trailmap#145 left them because the label is also the value `controlOutcome` is
handed back (`test/assets/fleet-format.test.js` passes `"play"` and
`"spawn now"` as the label to restore), so the text and the logic are coupled.

## Acceptance criteria

- The Loop buttons read "Play" / "Pause", "Spawn now" and "Skip".
- The restore-label path still puts back exactly what the button said, and the
  `controlOutcome` tests cover it with the new text.
- `scripts/dashboard-e2e.ts` passes.

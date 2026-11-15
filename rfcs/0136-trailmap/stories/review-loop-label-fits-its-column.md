---
title: "The review loop's label is written for its column, not truncated"
status: done
updated: 2026-11-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#142
claim: "2026-11-15T22:06:25Z"
assignee: "live-session-card-shows-its-event-log"
blocked-by: null
closed-reason: null
---

Found while working on trailmap#141. At Reviewer convergence the label above the review ring is ringo's raw last-action text, cut off with an ellipsis: "Claude review #1 (6 comme…" (`app/assets/stylesheets/application.css:803`, `white-space: nowrap; text-overflow: ellipsis` in a fixed-width stepper column). The mockup (`concepts/redesign/b-stepper-list.html`, `common.js` `reviewLoop`) gives two short lines instead: "Agent <doing what>" above the ring and "Reviewer <id> <doing what>" below it.

Expected: the label is written for the space it has (who acts, and a short verb), built from fields the envelope already carries (`review_owed`, the pane statuses, `reviewCycles`). The full text stays in a tooltip. Fixture test on the label text.

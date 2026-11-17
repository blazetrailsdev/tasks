---
title: "RFC page shows its refinements, like ringo's Refinements tab"
status: in-progress
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trailmap#151
claim: "2026-11-17T12:21:22Z"
assignee: "lay-out-the-remaining-pages-to-the-github-style-guide"
blocked-by: null
closed-reason: null
---

## Context

ringo's RFC page has a **Refinements** tab (`webhook/rfcs.go`: route `/rfc/<id>/refinements` at :243, tab link with a `RefineCount` counter at :863, panel at :895). It shows the last refine report for the RFC: when it ran, its outcome (changed / no-change / aborted), and the summary rendered as markdown, or "No refine report yet. Run “Refine stories” …" when there is none. The reports are the ones `scripts/rfc-refine-done.sh` posts to the dashboard (kind=rfc-refine); ringo lists them in `listRefines` (`webhook/audits.go:116`) and serves one in `HandleRefineFile` (:235).

trailmap's RFC page (`app/controllers/rfc-pages-controller.ts`) ports the stories tab and the lifecycle actions, and its header comment says what is still missing: "the refinements tab and the charts tab". `app/models/concerns/rfc-marks.ts` also notes it does not fold in ringo's refine-report record.

## Acceptance criteria

- trailmap stores the refine reports it receives (kind=rfc-refine: RFC id, outcome, summary markdown, time), in the database rather than local files.
- `/rfc/<id>/refinements` renders a Refinements tab beside Stories, with a count, showing the latest report (time, outcome, rendered summary) and ringo's empty-state text when there is none. Earlier reports are listed below it, newest first.
- An unknown RFC id is still a 404, as on the other tabs.
- Both apps (TS and `rails/`) render the same tab; controller tests assert the populated and empty states.

---
title: "/rfcs history ticks fold in the stored refine reports, as ringo's collectRFCMarks does"
status: draft
updated: 2026-11-17
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#151 stores refine reports in the hub (`app/models/rfc-refine.ts`, table `rfc_refines`). `/rfcs` draws each RFC's history ticks from `collectRfcMarks` (`app/models/concerns/rfc-marks.ts`), which reconstructs refinements from `spawn` events only. Its header still says "Not carried: ringo also folds in its own record of refine reports". ringo's `collectRFCMarks` folds those reports in.

## Expected shape

`/rfcs` also reads each RFC's refine reports (one hub query, no join; the RFC id is the key) and passes them to `collectRfcMarks`, which merges them with the spawn-derived marks as ringo does. Same in `rails/`.

## Acceptance criteria

- An RFC with a stored refine report shows a refine tick at the report's time on `/rfcs`, in both apps, with a test on each side.

- rfc-marks.ts no longer lists the refine record as not carried.

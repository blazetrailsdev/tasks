---
title: "rfc-refine-done.sh: POST the refine report to trailmap, keep /cleanup-pane only for the reap"
status: draft
updated: 2026-11-17
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: writers
packages: []
deps: [refinement-is-a-base-record-with-an-attached-summary]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** the tasks repo (`scripts/rfc-refine-done.sh`).

## Context

`scripts/rfc-refine-done.sh:59-71` sends
`{kind: "rfc-refine", id, outcome, pane, summary}` to btwhooks
`/cleanup-pane`, and btwhooks' `RecordRefine` (btwebooks
`webhook/spawnloop.go:2465-2485`) persists it to `refines.json` and
`refine-history.json`. trailmap's `POST /rfc-refines` takes the same body
(trailmap#151, `app/controllers/rfc-refines-controller.ts`). One caller is
not an RFC: btwebooks `webhook/grades.go:210` runs the script with the slug
`grades`, which trailmap answers with a 404 (RFC Open question 4).

## Acceptance criteria

- [ ] The script POSTs `{kind, id, outcome, summary}` to
      `${TRAILMAP_API:-http://127.0.0.1:8080}/rfc-refines` and prints the
      status. A non-2xx is reported on stderr and does not stop the reap.
- [ ] The `/cleanup-pane` POST stays, without `summary`, so btwhooks still
      reaps the pane.
- [ ] The `grades` arm follows Open question 4's resolution, and a comment
      cites `grades.go:210`.

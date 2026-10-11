---
title: "Drop the unneeded Relation cast in dailyRollup and the stale parity-body.html comment"
status: draft
updated: 2026-10-11
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Follow-up to trailmap#53. Two leftovers, neither behavioural.

- app/models/compare-run.ts:120 — `return rollup as unknown as Relation<CompareRun>;`
  The cast is not needed: with it removed `tsc --noEmit` is clean on that file.
  Return `rollup`.
- app/controllers/parity-graphs-controller.ts:44 — the class comment lists
  `parity-body.html` among the vendored files. No such file exists; the card
  markup landed as `app/views/parity-graphs/_cards.html.tse`.

## Acceptance

- [ ] cast removed, `pnpm build` clean
- [ ] comment names the file that exists

---
title: "trailmap: cover the spawn-loop panel's DOM wiring in the dashboard e2e harness"
status: done
updated: 2026-10-20
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#71
claim: "2026-10-20T14:01:25Z"
assignee: "bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards"
blocked-by: null
closed-reason: null
---

## Context

The spawn-loop panel's wiring in `app/assets/javascripts/dashboard.js`
(trailmap#66) is checked by hand only. What it says and posts is unit-tested
in `fleet-format.js`; these are not, and all three came out of review:

- the toggle is disabled until the first `spawn-loop` read answers, and titled
  when that read fails;
- a poll that started before a control's answer landed is dropped
  (`loopWrittenAt`);
- a refused setting alerts, blurs the field and re-reads, so the field takes
  ringo's value back.

trailmap#64 added a dashboard e2e harness (`dashboard-e2e` in CI).

## Acceptance criteria

- [ ] The e2e harness covers the three behaviours above against a stubbed ringo.

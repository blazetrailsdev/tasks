---
title: "trailmap: DOM test for the pulls tab's External inbox script"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: trailmap#209
claim: "2026-11-27T13:44:36Z"
assignee: "failed-deploy-release-alerts"
blocked-by: null
closed-reason: null
---

## Context

trailmap#189 added `app/assets/javascripts/external-prs.js`, the pulls tab's
External inbox. Its exported helpers (`reviewState`, `prsOf`, `isInboxEvent`)
are unit-tested in `test/assets/external-prs.test.js`. The page-side `boot()`
is not tested at all. Review rounds on #189 found five bugs there:

- a start error that was discarded;
- a focus note wiped by a redraw;
- one bad draft read blanking the whole inbox;
- a start whose event never arrived pinning the row in drafting;
- overlapping `draw()` calls painting out of order.

Each fix was checked by reading the code, and none has a test. The repo
already drives page scripts under happy-dom (`test/assets/dashboard-dom.test.ts`,
`pane-dom.test.ts`), so the same harness fits here.

## Acceptance criteria

- `test/assets/external-prs-dom.test.ts` mounts `#externalPrs` with stubbed
  `fetch` and `WebSocket`, and covers:
  - a failed start renders `.external-error` text in its row;
  - a focus note and its caret survive a redraw caused by an
    `external_pr.*` event for the same repo;
  - an event for another repo does not redraw;
  - one draft read that throws leaves the other rows drawn;
  - an `external_review.drafted` event clears a pending start;
  - a stale `draw()` that resolves last does not overwrite a newer one.
- Each assertion is shown failing with its fix reverted, then passing.

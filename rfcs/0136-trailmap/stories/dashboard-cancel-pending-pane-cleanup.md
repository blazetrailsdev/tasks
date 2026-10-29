---
title: "trailmap: cancel a pending pane cleanup from the dashboard"
status: in-progress
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#91
claim: "2026-10-28T22:52:30Z"
assignee: "check-the-transcript-page-under-its-csp-sandbox"
blocked-by: null
closed-reason: null
---

## Context

ringo 55a137e added a way to cancel a pane cleanup from the dashboard while it
is still in its pre-quit wait (the 60s initial delay, plus any 90s
still-working deferrals). Port the control the same way the other dashboard
controls were ported (`dashboard-queue-drain-and-poke`, trailmap#37/#65): the
button posts to ringo, which keeps the state; `webhook/dashboard.go` is not
touched.

ringo side, for reference:

- `PRState.teardownAt` (`webhook/tracker.go`) — when the pending cleanup next
  acts; set only while it is cancellable. Zero value serializes as
  `0001-01-01T00:00:00Z` and means "no cleanup pending".
- `POST /cancel-cleanup {"pane": "%NN"}` (`webhook/handler.go`
  `HandleCancelCleanup`) — 204 on cancel, 409 when there is nothing left to
  cancel (no teardown, or the quit already went out), 400 without a pane.
- ringo's row rendering: a "closing in Ns" pill plus a "cancel cleanup" button
  beside the status pill (`renderInto` / `cancelCleanup` in
  `webhook/dashboard.go`); the button reads "kept" on 204, "too late" on 409.

## Acceptance criteria

- [ ] A PR row whose `teardownAt` is set (non-zero) shows the countdown pill
      and a cancel button drawn by `control` with a `data-action`.
- [ ] The click posts `{pane}` to ringo's `/cancel-cleanup`; the outcome text
      ("kept" / "too late" / error) comes from `controlOutcome`.
- [ ] Whether a row shows the control (zero time, past deadline) is a pure
      function with unit tests.

---
title: "Server-render the dashboard's PR rows from pr_states, and make SSE a change notification"
status: draft
updated: 2026-09-08
rfc: "0136-trailmap"
cluster: null
packages: ["actionview", "actionpack"]
deps: ["move-tracker-state-into-the-database"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`render-the-fleet-dashboard-root-page`'s own "Superseded by phase B" section
describes the shape this story finishes. That story's `deps` named
`move-tracker-state-into-the-database`, but that dependency had not landed when
the dashboard was built (PR #19), so the page shipped in the **phase A** shape:

- PR rows are rendered in the browser, from the SSE envelope
  (`Tracker.ServeEvents`, `webhook/dashboard.go:2383`), by `prRow` in
  `app/assets/javascripts/fleet-format.js`.
- The page paints empty and fills in on the first frame, exactly as ringo's
  does (`const es = new EventSource('/events')`, `dashboard.go:2154`).

Phase B changes the premise: `PRState` becomes the `pr_states` table, so
trailmap can render PR rows from models server-side the way every other page in
RFC 0136 does, and the stream carries **change notification** rather than the
state itself.

Doing this was not possible in PR #19 and deliberately was not faked. This
story is the conversion, once the table exists.

## Shape expected

The port was structured so this is a move, not a rewrite. `prRow` is already a
pure function of one PR object with no DOM in it, sitting in `fleet-format.js`
beside its unit tests — the ONLY thing it needs is for the same markup to be
produced by a `.tse` from a model instead of by JavaScript from a frame.

- The row markup moves into `app/views/dashboard/` (a `_pr-row` partial or
  similar), driven by a `DashboardController#index` that reads `pr_states`.
- The existing `fleet-format.js` tests are the specification for what that
  partial must emit — including the branches they pin: pane-status override
  (`limit` and `waiting` beat the workflow status), merged-beats-draft on the
  icon, the CI rollup's position between title and labels, the fixer badge,
  singular/plural comment counts, and the omit-rather-than-guess rules.
- SSE keeps delivering the sections that have no table and are not moving:
  spawn-loop internals and live tmux pane state. RFC 0136's non-goals keep
  those on Go, and phase B does not move them.
- Consider whether the page still needs a client-side `prRow` at all after
  this, or whether an SSE change notification should re-fetch the rendered
  section. Say which in the PR rather than leaving both paths live — two
  renderers for one row is exactly the drift the equivalence gates exist to
  catch.

## Dependencies

Hard dependency on `move-tracker-state-into-the-database`. Should also settle
against `stream-a-live-pane-over-sse`, which shares the SSE-origin decision
already recorded in `docs/fleet-dashboard.md`.

## Acceptance criteria

- The dashboard's PR rows render server-side from models; the page has content
  before the stream connects.
- SSE carries change notification for those rows, not the rows' state.
- Go-owned state with no table (spawn-loop internals, live pane state) still
  arrives on the stream, unchanged.
- The markup matches what `fleet-format.js`'s tests pin today, and there are not
  two live renderers for a PR row.
- `webhook/dashboard.go`'s stream is still untouched.

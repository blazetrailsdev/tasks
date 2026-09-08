---
title: "Render the dashboard's reviewer line, from models rather than two browser fetches"
status: draft
updated: 2026-09-08
rfc: "0136-trailmap"
cluster: null
packages: ["actionview"]
deps: ["move-reviewers-and-usage-into-the-database"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`render-the-fleet-dashboard-root-page` (PR #19) ported ringo's `/` to trailmap
and rendered every pane the SSE envelope carries — but only the **worker** pane
(💪). ringo's PR rows carry a second line, the **reviewer** (📋), and it is the
one row element the port drops that ringo shows.

It was not an oversight, and it is not a "control surface" omission either. It
is a data-source boundary: the reviewer line is the only part of a PR row that
does **not** come from `Tracker.ServeEvents`' envelope. It is assembled from two
separate fetches ringo's dashboard makes on its own:

- `GET /reviewer/list` -> `loadReviewerList` (`webhook/dashboard.go:920-940`),
  keyed `owner/repo#pr` by `reviewerKey` (`dashboard.go:808`)
- `GET /reviewer/config` -> `loadReviewerConfig` (`dashboard.go:862`), which
  supplies `_nextReviewer` for the unassigned placeholder's `+` button

`reviewerLine` itself is `dashboard.go:812-832`. It folds three states into one
row, and all three matter:

1. **unassigned** — a dim `—` plus a `+` that spawns a reviewer of the currently
   configured agent
2. **pinned but no live pane** — the agent logo plus a `+` that re-dispatches
   the assignment (which spawns a fresh pane)
3. **live** — `paneLine(REV_EMOJI, e.pane_id, e.pane_status)` with the agent
   logo as its `lead`

Plus `agentLogo` (`dashboard.go:580-588`), which renders the company logo for
claude / copilot / codex / gemini and dims it when `blocked_by_usage` is set.

## Shape expected

`move-reviewers-and-usage-into-the-database` moves `reviewers.json` and
`reviewer-config.json` into tables. Once it lands, the reviewer line should
render **server-side from models**, the way the rest of RFC 0136's pages do —
not from two more browser fetches. That is the better shape and the reason this
is its own story rather than something PR #19 should have bolted on:

- `fleet-format.js` grows a `reviewerLine(entry)` beside `paneLine`, pure and
  tested like the rest of that module.
- The agent logos are static assets trailmap serves, not ringo (`/claude-logo.svg`
  et al. are ringo-hosted today).
- The `+` buttons are controls and belong with
  `port-the-dashboards-control-surface`, NOT here. This story renders the line
  and its three states; the buttons can land dark or come later.

## Dependencies

Depends on `move-reviewers-and-usage-into-the-database` for the table, and
should follow `server-render-the-dashboards-pr-rows` so both halves of a PR row
come from the same place.

## Acceptance criteria

- Dashboard PR rows show the reviewer line beside the worker line, with all
  three states (unassigned, pinned-without-pane, live).
- The agent logo renders per agent and dims when the reviewer is blocked by
  usage, as `agentLogo` does.
- The data comes from models, not from `/reviewer/list` and `/reviewer/config`
  browser fetches.
- The logo assets are served by trailmap.
- `fleet-format.js`'s reviewer rendering is unit-tested like its neighbours.

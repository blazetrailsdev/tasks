---
title: "trailmap: derive a session's stage from the fleet envelope"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A session is a PR row or a spawn row. `prRow` (`app/assets/javascripts/fleet-format.js:928`)
reads `draft`, `merged`, `ciStatus`, `reviewCycles` and `paneStatus`,
`reviewerLine` (`:203`) reads the reviewer list, and `spawnRow` (`:864`)
renders a spawn with its `story`. The RFC's "A session and its stage" gives a
six-row decision list that is total by construction.

## Acceptance criteria

- [ ] `sessionStage(row, reviewers, reported = null)` in `fleet-format.js`
      returns one of `drafting`, `self`, `ringo`, `ci`, `ready`, `merged` by
      the RFC's decision list, first match wins.
- [ ] `reported` is honored for row 2 only: a spawn with no PR and
      `reported === "self"` returns `self`. Every other row ignores it.
- [ ] Tests cover each of the six rows and these boundaries: - a draft PR, no reviewer, `reviewCycles` above 0, `openFindings` 0
      (row 6, Getting CI green); - a draft PR, no reviewer, `reviewCycles` 0, CI failing (row 4, Self
      review); - a non-draft PR with a reviewer assigned (row 3); - a merged PR with CI failing (row 1); - a non-draft PR, CI passing, `openFindings` above 0 (row 3); - a spawn with no PR and `reported` set to `merged` (row 2, Drafting).
- [ ] No rendering changes in this story.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js`.

## Notes

The function is written to move. `server-render-the-dashboards-pr-rows`
(RFC 0136) ports `fleet-format.js`'s pure functions to a helper over
`PrState`, and these tests become that helper's specification.

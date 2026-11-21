---
title: "trailmap-external-pr-inbox-age-and-sent"
status: draft
updated: 2026-11-21
rfc: "0253-external-contributor-prs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#189 (`trailmap-external-pr-inbox`) shipped the pulls tab's External
inbox (`app/assets/javascripts/external-prs.js`, `reviewState`). Two of its
original criteria could not be met from what ringo records:

- ringo's `ExternalPR` (btwhooks `webhook/external.go`, `type ExternalPR`)
  has no opened-at time, only `lastActivityAt`. So the row shows "opened …"
  only when an `openedAt` field is present, and ringo never sends one.
- `sent` cannot be derived. Nothing records a review posted to GitHub until
  `trailmap-sends-approved-review-to-github` stores the GitHub review id
  beside the draft.

## Acceptance criteria

- ringo's `ExternalPR` carries `openedAt`, stamped from the PR's
  `created_at` on its first recorded action, and `GET /api/external-prs`
  serves it. Each inbox row shows the PR's age from it.
- `reviewState` answers `sent` for a PR whose stored draft has a recorded
  GitHub review id, and `stale` once the PR moves after that send. A test in
  `test/assets/external-prs.test.js` covers both.

---
title: "trailmap: derive a session's stage from the fleet envelope"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: []
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
reads `pr.draft`, `pr.merged`, `pr.ciStatus`, `pr.reviewCycles`,
`pr.nextAction` and `pr.paneStatus`, and the reviewer list comes from
`reviewerLine` (`:203`). `spawnRow` (`:864`) renders a spawn with no PR. The
RFC's table maps these to six stages.

## Acceptance criteria

- [ ] `sessionStage(pr | spawn, reviewers)` in `fleet-format.js` returns one
      of `drafting`, `self`, `ringo`, `ci`, `ready`, `merged`, by the RFC's
      table.
- [ ] It prefers a reported stage field when the input carries one, so
      `fleet-session-reported-stage` needs no change here.
- [ ] `test/assets/fleet-format.test.js` covers each stage and the ambiguous
      inputs: a draft PR with CI red and no reviewer, a merged PR with CI
      failing, and a reviewer assigned to a non-draft PR.
- [ ] No rendering changes in this story.

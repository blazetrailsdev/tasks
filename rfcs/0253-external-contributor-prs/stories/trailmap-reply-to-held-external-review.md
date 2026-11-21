---
title: "trailmap: Reply to a held external review through the draft/edit/send path"
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

trailmap-forward-external-review-to-agent shipped "Forward to agent" for a
review or comment ringo holds off a trusted PR (ringo
`webhook/externalontrusted.go`, `GET /api/external-on-trusted`,
`POST /external-review/forward`; trailmap
`app/assets/javascripts/external-prs.js` `heldRow`). Its **Reply** action
is only a link to the PR on GitHub: the draft/edit/send path it should go
through is the review-draft editor (trailmap-review-draft-editor), which has
not landed.

## Acceptance criteria

- The held item's **Reply** opens the draft/edit/send path with an empty
  owner-written reply quoting the item, and nothing is posted to GitHub
  until the owner sends.
- ringo posts the sent reply with the owner's credential, not an agent's.
- A test asserts that no reply is posted without the send action.

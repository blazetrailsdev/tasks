---
title: "Render the PR timeline on /sessions/:owner/:repo/:pr"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
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

trailmap#81 ported `/sessions/:owner/:repo/:pr` without the PR timeline that ringo shows above the per-pane cards. ringo builds that timeline in `servePR` (btwebooks `webhook/sessionarchive_page.go`) by calling `writePRTimeline(w, st.prTimeline(owner, repo, pr, archives))`, and it reads ringo state from outside the archive index, so `/api/sessions` does not carry it.

## Acceptance criteria

- ringo exposes the timeline rows as JSON, or trailmap gets them from data it already has. The model reads them; the controller does not re-implement them.
- The show page renders the timeline above the cards with the same rows and order as ringo's.
- A controller test covers it.

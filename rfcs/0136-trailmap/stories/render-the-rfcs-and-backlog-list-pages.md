---
title: "Server-render /rfcs and /backlog, replacing the JS shells"
status: draft
updated: 2026-09-03
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["render-the-rfc-and-story-show-pages"]
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

The rollout names the list pages but no story covers them. `/rfcs` and
`/backlog` are the highest-traffic pages in ringo and the ones the fleet reads
most, so they follow the show pages.

They are a bigger change than the show pages because they are not
server-rendered today. `webhook/rfcs.go:142` `HandleRFCsPage` prints a constant
HTML shell, and the browser fetches `/spawnloop/rfcs` for the data; the backlog
page works the same way. Porting them means server-rendering what the browser
currently assembles — a genuine improvement, and a real diff.

Worth keeping while porting: the counts and rollups the pages show (done vs
total, ready counts, done percentage) are computed in Go today and become model
methods, so they must agree with the show pages rather than being computed a
second way.

ringo keeps serving both pages until each replacement is verified.

## Acceptance criteria

- `/rfcs` and `/backlog` render server-side from trailmap's models, with no
  client-side data fetch for the initial view.
- Both show the same RFCs, stories, counts and ordering as ringo's versions,
  for the full database.
- The rollups reuse the model methods the show pages use.
- ringo's versions still work; nothing is deleted in this story.

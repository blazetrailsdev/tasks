---
title: "Serve /rfc/<id> and /story/<id> from trailmap"
status: claimed
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps:
  ["serve-the-read-verbs-as-json", "build-the-trailmap-app-shell", "render-markdown-in-trailmap"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: "2026-09-06T17:58:18Z"
assignee: "render-the-rfc-and-story-show-pages"
blocked-by: null
closed-reason: null
---

## Context

The first pages to serve from trailmap are the RFC and story show pages —
`/rfc/<id>` and `/story/<id>`. They are the right first slice because they are
already server-rendered from real data in Go (`webhook/rfcs.go:174`
`HandleRFCPage`, `webhook/story.go:100` `HandleStoryPage`): a SQLite read, a
markdown render, a template. No writes, no tmux, no streaming.

The list pages are deliberately not in this story. `/rfcs` and `/backlog` are
JS shells today — `HandleRFCsPage` prints a constant and the browser fetches
`/spawnloop/rfcs` — so porting them means server-rendering what the browser
assembles, which is a genuine improvement but a bigger diff.

Two things the show pages need that trailmap does not have yet: markdown
rendering, with no trails counterpart to `webhook/markdown.go` (an ordinary npm
library is fine — trails' fidelity rules govern the framework, not its
consumers), and the status colours and tab structure the Go templates encode.

ringo keeps serving these pages until each replacement is verified, so this is
additive.

## Acceptance criteria

- `/rfc/<id>` and `/story/<id>` render from trailmap's models.
- For every RFC and story in the database, trailmap's page shows the same
  title, status, story list, done-count and rendered markdown as ringo's.
- The pages use the app's layout and are reachable behind the existing SSO.
- ringo's versions still work; nothing is deleted in this story.

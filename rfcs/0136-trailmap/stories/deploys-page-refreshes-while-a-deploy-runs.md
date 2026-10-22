---
title: "/deploys refreshes while a deploy is running, as ringo's page does"
status: draft
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo's /deploys polls `/api/deploys` every 5s and refreshes the log of any run
that is still running (webhook/deploys_page.go, `setInterval(load, 5000)`).
trailmap's page (trailmap#77, app/views/deploys/index.html.tse) is rendered on
the server and static, so a deploy in progress looks frozen until the viewer
reloads.

## Acceptance criteria

- While any row is `running`, the page re-reads on a timer.
- No inline script, following the pane page's config-element pattern.
- An expandable log per row, matching ringo's row toggle.
- A test covers the running case.

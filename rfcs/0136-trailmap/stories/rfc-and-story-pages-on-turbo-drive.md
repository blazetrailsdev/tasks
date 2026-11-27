---
title: "RFC list, RFC page and story page run under Turbo Drive"
status: in-progress
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#206
claim: "2026-11-27T03:14:41Z"
assignee: "ci-runs-hub-migrations-through-db-migrate"
blocked-by: null
closed-reason: null
---

## Context

trailmap#194 loads Turbo Drive, with nine pages opted out by
`turbo-visit-control: reload` because their module scripts run once at load.
Three of them have scripts that only bind listeners to elements in `<body>`,
which the swap discards: `app/assets/javascripts/rfc-sort.js` (RFC list) and
`app/assets/javascripts/rfc-actions.js` (RFC page, story page). Both apps'
controllers already answer a mutation with 303 and a refusal with 422/409.

## Acceptance criteria

- `rfc-sort.js` and `rfc-actions.js` bind on `turbo:load`, so they work on every Drive visit.
- RFC list, RFC page and story page drop the reload opt-out in both apps.
- Their forms submit through Drive; a refusal still renders its message.

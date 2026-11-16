---
title: "dashboard e2e asserts the palette footer in message mode too"
status: draft
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#148 made the command palette's footer follow its mode (`data-foot-mode` in `app/views/dashboard/index.html.tse`). `scripts/dashboard-e2e.ts` ("palette footer hints follow the mode") checks search, spawn and broadcast, but not message mode: that mode is opened from a session card, and the loop never opens one.

## Acceptance criteria

- The e2e opens message mode from an expanded session card and asserts the footer shows "↵ send" and nothing else.

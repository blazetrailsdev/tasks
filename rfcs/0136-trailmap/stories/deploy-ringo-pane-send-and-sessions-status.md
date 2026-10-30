---
title: "Review and deploy ringo's /pane/<n>/send and /api/sessions/status branch"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#96 depends on two ringo endpoints that sit on btwebooks' local branch `ringo-pane-send-status-cron-events` (commits bef7c7e, 130f628). btwebooks has no GitHub repo, so nothing has reviewed them, and they are not deployed:

- `GET /api/sessions/status`: until it is deployed, trailmap's `/sessions` shows neither archive note.
- `POST /pane/<n>/send`: `send-a-message-to-a-pane-from-its-live-view` needs it.

## Acceptance criteria

- The branch is reviewed, merged into btwebooks `main` and deployed (`git push dokku`).
- `curl <ringo>/api/sessions/status` answers JSON, and trailmap's `/sessions` shows ringo's mode note against the live archive.
- `pnpm tasks done ringo-sends-a-line-of-text-to-a-pane` once `/pane/<n>/send` is live.

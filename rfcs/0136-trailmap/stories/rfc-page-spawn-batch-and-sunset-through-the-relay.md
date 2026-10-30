---
title: "rfc-page-spawn-batch-and-sunset-through-the-relay"
status: claimed
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - rfc-page-lifecycle-buttons-and-ready-all-drafts
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-30T00:53:46Z"
assignee: "bound-the-transcript-parse-on-the-request-thread"
blocked-by: null
closed-reason: null
---

## Context

`/rfc/<id>` in trailmap (`app/controllers/rfc-pages-controller.ts:80`) left
out "spawn a batch" and "sunset" because both start an agent, which is ringo's
dispatch and not a database write. ringo serves them from btwebooks:
`/spawnloop/rfc-batch-spawn` → `HandleRFCBatchSpawn` (`main.go:340`,
`webhook/rfcs.go`), plus the sunset dispatch on the same page. Sunset is not a
`tasks rfc-status` value: an agent re-homes the drafts worth keeping
(`tasks/src/rehome.ts:19`) and then closes the RFC, which `rfc-status` refuses
while stories are open (`rfc-status.ts:79-92`).

trailmap already relays dispatches to ringo through
`this.post("fleet/control/*path", { to: "fleet#control" })`
(`config/routes.ts:56`); the dashboard's manual spawn uses it
(`dashboard-manual-spawn-joins-the-control-listener`).

## Acceptance criteria

- `/rfc/<id>` renders "Spawn batch" for an RFC with claimable stories, posting
  through the `fleet/control` relay to ringo's `rfc-batch-spawn` with the same
  payload and confirm text as ringo's page.
- `/rfc/<id>` renders "Sunset" for an open RFC, relayed the same way to ringo's
  sunset dispatch.
- A relay failure (ringo down, refusal) shows ringo's error text on the page.
- No spawn logic is added to trailmap; it only relays.

---
title: "/rfc/<id> has no refine button and sends sunset without the operator's note"
status: done
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trailmap#102
claim: "2026-10-30T23:02:36Z"
assignee: "deploy-ringo-pane-send-and-sessions-status"
blocked-by: null
closed-reason: null
---

## Context

trailmap#96 added a sunset button to `/rfc/<id>`. It posts `{slug, note: "", mode: "sunset"}` through the `fleet/control` relay to ringo's `spawnloop/rfc-refine`. ringo's own page sends the operator's note from a `refineNote` textarea with both its refine and sunset actions (btwebooks `webhook/rfcs.go:922`, `spawn()` at :1017). That note is how an operator steers where re-homed stories go and what the close should say. trailmap has no textarea, so its sunset always goes out without a note, and its page has no refine button at all.

## Acceptance criteria

- `/rfc/<id>` renders ringo's note textarea and a "Refine stories" button, both relayed through `spawnloop/rfc-refine` with ringo's confirm text.
- Sunset sends the textarea's note, as ringo's page does.
- The same in `rails/app/views/rfc_pages/show.html.erb`, with tests on both sides.

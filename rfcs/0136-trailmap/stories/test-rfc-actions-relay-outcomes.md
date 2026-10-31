---
title: "rfc-actions.js has no test for its relay outcome messages"
status: done
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#102
claim: "2026-10-30T23:02:36Z"
assignee: "deploy-ringo-pane-send-and-sessions-status"
blocked-by: null
closed-reason: null
---

## Context

`relayed()` in `app/assets/javascripts/rfc-actions.js` picks the message shown after a relay. trailmap#98 fixed a crash there when a 2xx answer was not JSON, and no test covers that path: controller tests only assert the rendered buttons.

## Acceptance criteria

- A test covers `relayed()` for `spawnloop/story-spawn`, `spawnloop/rfc-batch-spawn` and `spawnloop/rfc-refine`, each with JSON and with a null body.

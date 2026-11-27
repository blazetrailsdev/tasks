---
title: "Morph the fleet list with Turbo's idiomorph, and land #195's other review fixes"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#205
claim: "2026-11-26T23:14:37Z"
assignee: "bump-the-ringo-pin-for-rfc-session-endpoints"
blocked-by: null
closed-reason: null
---

trailmap#195 merged at 498eb06 before its review findings were addressed. The fixes exist as local commit 5168bf3 on branch `fleet-morph-uses-turbo-idiomorph`, in the worktree `when-an-agent-asks-with-multiple-questio-fda7`. That commit is not pushed. Each finding with its fix:

1. `app/assets/javascripts/morph.js` is a hand-rolled DOM morph, although Turbo 8.0.23 (loaded since #194) exports idiomorph as `morphChildren`. Replace the hand-rolled morph with `morphChildren`. idiomorph copies live `value` and `checked` from the new markup (`syncInputValue`, @hotwired/turbo dist/turbo.es2017-esm.js:2730), which would wipe typed state in fields that are not focused. So veto it with a `turbo:before-morph-attribute` listener: cancel `value` on text boxes and `checked` on radios and checkboxes (`ignoreAttribute`, :2826). Add a test that a typed value in a box that is not focused survives a morph.
2. `scripts/dashboard-e2e.sh`: the `pg_isready` and `psql` waits loop forever if the container exits. Cap them at 60s, then print `docker logs` and exit 1.
3. `keepWhileRepainting` (dashboard.js) re-focuses and resets the caret on the very node the morph kept. Skip restoring a node that is the one captured before the paint, or that is still focused.

The duplicate-id question from the review goes away with idiomorph's id-set matching.

Acceptance: the three changes land, and `pnpm vitest run test/assets` and `./scripts/dashboard-e2e.sh` pass.

---
title: "a production-mode trails server accepted connections and never answered (reproduce first)"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while porting trailmap to Rails (trailmap#85, `rails/DEVIATIONS.md`, "trails: a production-mode server never answered a request").

`NODE_ENV=production bin/trails server -p 4101`, run locally in the trailmap checkout against the live tasks database and the hub, logged that it was listening and then held every connection open without answering, `/up` included. It was seen once and not investigated. That run skipped `scripts/build-assets.sh`, which the deployed image runs first, so missing built assets are the first thing to rule out. The deployed app answers, so this may be only that.

Expected: a production-mode `trails server` either answers, or fails at boot with an error that names what is missing (as Rails raises for a missing asset or a missing `secret_key_base`). A server that accepts connections and never answers is the wrong shape either way.

## Acceptance criteria

- Reproduce it in a trailmap checkout without built assets, or show that it does not reproduce and close this story with `FALSIFIED:`.
- If it reproduces, the cause is fixed in trailties so that the server answers or exits at boot with an error, and a trailties test covers that case.

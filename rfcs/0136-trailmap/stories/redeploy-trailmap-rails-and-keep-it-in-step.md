---
title: "Redeploy trailmap-rails from main (stale pre-0243 build lists 0 audits) and keep the twin in step"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#188 unmounted ringo's audits directory and unset `AUDITS_DIR` on both `trailmap` and `trailmap-rails`. The `trailmap-rails` container is still running a build from before RFC 0243: its `/audits` renders "This deployment has no AUDITS_DIR, so there is no directory to list", and current `rails/app` no longer contains that text. So the twin lists 0 audits where `trailmap` lists 95. Both apps read `audits` from the same `TASKS_DATABASE` primary (`rails/config/database.yml`, `production.primary`), so this is deploy drift, not a data gap. The redeploy (`git push dokku-rails origin/main:trunk`, docs/deploy-rails.md "Deploying") was refused by the agent permission check and needs the operator. Nothing redeploys the twin when main moves, so it drifts silently.

## Acceptance criteria

- [ ] `trailmap-rails` is redeployed from main, and its `/audits` lists the same reports as `trailmap` (95 as of 2026-11-21).
- [ ] The twin is redeployed whenever `trailmap` is (a deploy step, or a tandem check that reds on a stale twin), so it cannot fall behind unnoticed.

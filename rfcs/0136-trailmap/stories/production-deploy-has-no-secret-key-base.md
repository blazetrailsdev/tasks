---
title: "trailmap: every deploy since #30 fails, production has no secret_key_base"
status: done
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 0
pr: trailmap#35
claim: "2026-10-05T16:18:07Z"
assignee: "production-deploy-has-no-secret-key-base"
blocked-by: null
closed-reason: null
---

## Context

Since trailmap#30 the framework honours `NODE_ENV=production` (the Dockerfile has always set it; the
old pin ignored it and ran in development). Production requires `secret_key_base`, the deployment
has none (`dokku config:keys trailmap`: AUTHELIA_DOMAIN, GIT_REV, NODE_ENV, TASKS_DATABASE,
TASKS_DIR), and every request raises `Missing secret_key_base for 'production' environment` before
any middleware runs. The new container never answers `/up`, the health check kills it
(`trailmap.web.1.upcoming-*` exited 143 on 2026-10-03), and the previous build keeps serving. Every
merge since #30 is undeployed.

Verified locally: with `SECRET_KEY_BASE` set, production mode serves `/up`, `/`, `/rfcs`, `/backlog`,
`/rfc/<id>` and `/stories.json`.

`scripts/smoke-boot.sh` did not catch it because it boots in the default environment.

## Acceptance criteria

- [ ] The deployment has a `SECRET_KEY_BASE` and a deploy of current `main` goes live.
- [ ] The smoke boot runs in production mode, as the Dockerfile does, and fails when the secret is missing.
- [ ] The deploy notes say the variable is required.

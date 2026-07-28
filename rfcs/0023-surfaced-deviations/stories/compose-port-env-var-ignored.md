---
title: "docker compose ignores MYSQL_PORT/PG_PORT, blocking isolated local DB projects"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
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

`docker-compose.yml:23` publishes MySQL as `"${MYSQL_PORT:-13306}:3306"`, but
`docker compose` does not pick the variable up from the shell environment in
this repo: with `MYSQL_PORT=13991` exported, `docker compose config` still
renders `published: "13306"` and `up` fails with
`Bind for 0.0.0.0:13306 failed: port is already allocated` whenever a sibling
agent's MySQL already holds the default port.

Hit while verifying #5526: the only working route was an override file
(`services: mysql: ports: !override [...]`) passed via a second `-f`.
The PG service has the same shape (`${PG_PORT:-25432}`) and is presumably
affected identically. This blocks the isolated-compose-project workflow that
parallel agents rely on for local MySQL/PG runs.

## Acceptance criteria

- [ ] `MYSQL_PORT=<n> docker compose -p <proj> up -d mysql` binds `<n>`
      (same for the PG service), or the documented invocation is fixed to one
      that actually works.
- [ ] Root cause identified (interpolation source precedence — `.env`
      discovery, compose version, or wrapper) rather than papered over.

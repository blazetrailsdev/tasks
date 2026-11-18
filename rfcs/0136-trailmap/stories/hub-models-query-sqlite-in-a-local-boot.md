---
title: "hub-models-query-sqlite-in-a-local-boot"
status: ready
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A local `bin/trails server` booted against the dev hub (`HUB_DATABASE_URL` from
`dokku postgres:info trailmap-hub-dev --dsn`, migrated) serves `/rfcs`,
`/backlog` and `/audits`. But `/`, `/deploys` and `/sessions` 500 with
`SQLite3::SQLException: no such table: owners` or `no such table: settings`, and the
process then exits on the unhandled error. `Owner extends Hub`
(`app/models/owner.ts:18`), and `config/initializers/hub-database.ts`
establishes `Hub`, yet these queries reach the task-domain SQLite connection.
Another worktree's server on main (port 8187) reproduces it on 2026-11-17, so
it predates trailmap#157. It blocks the light/dark/390 screenshots of those
pages that the style-guide story asks for.

## Acceptance criteria

- Find whether the hub models lose their connection in trailmap or in trails.
  A framework cause is fixed in trails, with a test there.
- With a migrated dev hub, `/`, `/deploys` and `/sessions` answer 200 locally.
- An unhandled query error in a request does not exit the server.

---
title: "The README's dev hub DSN names a docker-only host, so a host boot cannot reach it"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 5
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

README "Running it" (`README.md:154`) and the requirements (`README.md:85`)
tell a developer to point at the dev hub with
`HUB_DATABASE_URL="$(dokku postgres:info trailmap-hub-dev --dsn)"`. That DSN
names the host `dokku-postgres-trailmap-hub-dev`, which only resolves inside
dokku's docker network. On the host (2026-11-17), the boot and the hub tests
fail with "issue connecting to your database with your username/password".
It works only after hand-substituting the container IP (`docker inspect
dokku.postgres.trailmap-hub-dev`, 10.200.0.6). The dev hub was also missing
the `rfc_refines` migration from #151, and nothing flagged it until boot.

## Acceptance criteria

- README gives a host-reachable dev hub URL: expose the service
  (`dokku postgres:expose`) and document the `localhost:<port>` form, or
  provide a script that prints it.
- `HUB_TEST_DATABASE_URL` setup is documented the same way, so the hub
  tests run instead of failing on auth.

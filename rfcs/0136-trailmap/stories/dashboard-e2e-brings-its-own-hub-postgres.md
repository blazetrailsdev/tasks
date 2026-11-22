---
title: "dashboard-e2e brings its own hub Postgres for a local run"
status: in-progress
updated: 2026-11-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#195
claim: "2026-11-22T22:18:55Z"
assignee: "dashboard-e2e-brings-its-own-hub-postgres"
blocked-by: null
closed-reason: null
---

`scripts/dashboard-e2e.sh` boots trailmap, which refuses to start without `HUB_DATABASE_URL` (a Postgres). CI provides a service container, but a local run has to point at some existing Postgres. During trailmap#192, a local run migrated trailmap's hub tables into an unrelated project's database on the dev box, because the throwaway container could not bind its port.

Expected: the script starts its own disposable Postgres when `HUB_DATABASE_URL` is unset, on a free port, and removes it on exit. Or it fails with a message that says how to supply one. Either way, it never silently uses whatever is listening.

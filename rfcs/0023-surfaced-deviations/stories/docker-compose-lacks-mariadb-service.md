---
title: "docker-compose.yml has no mariadb service, so CI's MariaDB lane is not locally reproducible"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Local dev infrastructure (docker-compose service), not a divergence from Rails behaviour."
---

## Context

Surfaced while doing `docker-compose-db-services-lack-ci-tmpfs` (PR #5641).
CI runs a full MariaDB lane — `.github/workflows/ci.yml` has a `mariadb:11`
service container (with `--mount type=tmpfs,destination=/var/lib/mysql`), and
a set of gate/skip conditions in the AR suite key off MariaDB specifically.
`docker-compose.yml` has only `postgres` and `mysql` services, so a
MariaDB-only CI failure cannot be reproduced locally with `pnpm db:up`; the
agent has to hand-run a container and guess at the CI service's config.

## Acceptance criteria

- Add a `mariadb:11` service to `docker-compose.yml` mirroring the CI service
  container: same image, the same db-init provisioning as the `mysql` service,
  a `tmpfs` mount on `/var/lib/mysql`, a `MARIADB_PORT`-style port override,
  and an equivalent healthcheck.
- Document the lane in the README's local-database section alongside the
  existing services.
- Confirm a MariaDB-gated AR test file passes against it locally.

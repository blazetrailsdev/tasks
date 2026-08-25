---
title: "docker-compose db services lack CI's tmpfs, timing out DDL-heavy local runs"
status: done
updated: 2026-07-30
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5641
claim: "2026-07-30T14:14:18Z"
assignee: "docker-compose-db-services-lack-ci-tmpfs"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while verifying PR #5448 against local containers.
`docker-compose.yml`'s `mysql:8` service has no tmpfs mount, so its data dir is
on disk and every DDL fsyncs. `packages/activerecord/src/support/drop-all-tables.test.ts`
then blows its 5s test / 30s hook timeouts locally: the same file passes with
raised timeouts, taking ~40s of test time for the same DDL.

CI already mounts the data dir on tmpfs for both `mysql:8` and `mariadb:11`
(`.github/workflows/ci.yml`, `--mount type=tmpfs,destination=/var/lib/mysql`),
with a measured ~17% suite win, so only local `docker compose` runs pay this.
The Postgres service in `docker-compose.yml` is likewise not on tmpfs while
CI's is.

This makes local MySQL runs look red for reasons unrelated to the code under
test, which costs debugging time on every DDL-heavy story.

## Acceptance criteria

- Mount the data dirs of the `docker-compose.yml` mysql and postgres services on
  tmpfs, matching what CI does (the databases are throwaway per-run).
- Confirm `drop-all-tables.test.ts` passes locally at the default timeouts on
  the mysql2 lane afterwards.

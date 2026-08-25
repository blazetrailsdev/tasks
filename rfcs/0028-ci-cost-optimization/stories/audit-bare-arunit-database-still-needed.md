---
title: "Audit whether the bare activerecord_unittest database is still needed by stamped runs"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6181
claim: "2026-08-07T16:37:44Z"
assignee: "port-command-recorder-test-cases-part-2"
blocked-by: null
closed-reason: null
---

## Context

After PR #5638 a stamped run never connects to the bare `activerecord_unittest`
database: `globalSetup`'s PG admin connection targets `postgres`, the MySQL admin
connection carries no database, and every worker resolves
`activerecord_unittest_<runToken>_<slot>` through `applySlot`
(`packages/activerecord/src/support/config.ts`). The bare name survives only as
the _base_ those per-run names are built from.

It is still provisioned as a real database by `docker-compose.yml`
(`POSTGRES_DB` / `MYSQL_DATABASE`) and by the CI service containers, and the
init scripts in `scripts/db-init/` run against it. Whether any of that is still
load-bearing has not been checked — the `pg` and `mysql2` drivers may still need
a connectable database name for the admin handshake on some paths, and the
harness-less fallback in `applySlot` (no run token stamped) does still use it.

This is an audit, not a removal: the answer may well be "keep it".

## Acceptance criteria

- Determine whether the bare `activerecord_unittest` database still needs to
  exist on a PG or MySQL server for a stamped run to succeed, and record the
  answer where the provisioning lives.
- If it is genuinely vestigial for stamped runs, say so explicitly rather than
  deleting it — the token-less `applySlot` fallback and any direct adapter
  scripts still name it.
- No change to CI service-container configuration unless the audit shows one is
  needed.

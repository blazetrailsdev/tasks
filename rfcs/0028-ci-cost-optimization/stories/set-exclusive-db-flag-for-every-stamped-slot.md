---
title: "Set the exclusive-database flag for every stamped slot, not just slot 2 and up"
status: done
updated: 2026-07-31
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: 5710
claim: "2026-07-31T15:12:03Z"
assignee: "set-exclusive-db-flag-for-every-stamped-slot"
blocked-by: null
closed-reason: null
---

## Context

PR #5638 stamped the run token into every PG/MySQL slot database name, so slot 1
is now `activerecord_unittest_<runToken>_1` rather than an alias for the shared
base database. Every slot is therefore an exclusive per-worker, per-run database.

`packages/activerecord/src/test-setup-worker-db.ts:169,174` still gates on the
pre-stamp assumption:

```ts
if (slot > 1) process.env.AR_PG_EXCLUSIVE_DB = "1";
```

That flag tells `test-setup-dy.ts` it may use `reconstructFromSchema`
(purge plus load) instead of the slower `loadSchema` path, on the grounds that
no sibling worker shares the database. With stamping, the grounds now hold for
slot 1 too, so the worker that wins slot 1 pays the slow path for no reason.

Left out of #5638 deliberately: flipping the gate changes which DDL path a
worker takes, which is a behaviour change worth its own PR and its own timing
measurement rather than a rider on the naming change.

## Acceptance criteria

- The exclusive-database flags are set for every claimed slot, including slot 1,
  or the gate is replaced by whatever signal actually expresses "this worker
  owns its database" once a run token is stamped.
- The pre-stamp fallback still behaves correctly: when no run token is stamped,
  `applySlot` keeps the shared-base-plus-suffix naming, and slot 1 is genuinely
  the shared base database, so the flag must NOT be set there.
- Confirm the intended effect on the PG and MySQL lanes: the slot 1 worker takes
  the same per-file setup path as slots 2..N.

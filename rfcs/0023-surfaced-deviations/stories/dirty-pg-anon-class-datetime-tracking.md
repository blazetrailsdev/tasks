---
title: "Converge PG anonymous-reflected-class datetime dirty-tracking gap"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3712
claim: "2026-06-20T13:13:29Z"
assignee: "dirty-pg-anon-class-datetime-tracking"
blocked-by: null
---

## Context

`packages/activerecord/src/dirty.test.ts` gates two tests on a runtime guard
(`pgDirtyTrackingBlocked = adapterType === "postgres"`) because they expose a
PostgreSQL-only dirty-tracking gap: a datetime attribute on an anonymous
reflected class (`class extends Base { static tableName = "topics" }`) reads
back `undefined` after `create` on PG (works on SQLite + MySQL).

Affected tests (Rails runs both unconditionally):

- "nullable datetime not marked as changed if new value is blank"
- "datetime attribute can be updated with fractional seconds"

Surfaced by RFC 0032 gate-over-gated-burndown: the previous `adapterType`
gate was an over-gate vs Rails. It is now encoded as an incomparable runtime
guard pending this convergence.

## Acceptance criteria

- [ ] Root-cause the PG-only `undefined` read-back of a datetime attribute on an
      anonymous reflected class after `create`.
- [ ] Remove the `pgDirtyTrackingBlocked` guard so both tests run on PostgreSQL.
- [ ] `test:compare --package activerecord --gates` stays at 0 over-gated for
      dirty.test.ts.

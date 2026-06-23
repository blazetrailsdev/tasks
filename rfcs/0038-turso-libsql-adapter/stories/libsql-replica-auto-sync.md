---
title: "libsql: opt-in periodic auto-sync for embedded replicas"
status: claimed
updated: 2026-06-23
rfc: "0038-turso-libsql-adapter"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: "2026-06-23T15:37:26Z"
assignee: "libsql-replica-auto-sync"
blocked-by: null
---

## Context

`libsql-embedded-replica` (PR #3692) added embedded-replica mode with a
caller-driven `LibSQLReplicaAdapter.syncReplica()`. Periodic/background auto-sync
was deliberately deferred (RFC 0038 open question 3); no stub was left.

libsql's `Database` accepts a `syncPeriod` option (and `syncUrl`) to enable
the native background sync loop. An adapter-owned auto-sync would let a replica
stay fresh without an explicit caller trigger.

Relevant code:

- `packages/activerecord/src/connection-adapters/libsql-replica-adapter.ts` (`syncReplica`)
- `packages/activerecord/src/sqlite/libsql.ts` (`openReplicaDatabase`, `libsqlReplicaDriver`)

## Acceptance criteria

- [ ] Opt-in periodic sync wired through config (e.g. `syncPeriod` in
      driverOptions, or an adapter-level timer) — caller chooses; off by default.
- [ ] No always-on timer: a replica with no auto-sync config behaves exactly as
      today (caller-driven `syncReplica()` only).
- [ ] Lifecycle: any timer is cleared on adapter `disconnect`/`close` so it does
      not leak or fire against a closed handle.
- [ ] Tests: offline test that auto-sync config is threaded; env-gated test that
      a replica converges without an explicit `syncReplica()` call.

## Notes

Resolves RFC 0038 open question 3. Decide between libsql's native `syncPeriod`
vs an adapter-owned timer; prefer the native option if it satisfies the
lifecycle requirement (no JS timer to manage).

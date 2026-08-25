---
title: "isPreventingWrites primary-class case still displaces Base's pool"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5682
claim: "2026-07-30T21:39:18Z"
assignee: "ispreventingwrites-primary-class-case-displaces-base-pool"
blocked-by: null
closed-reason: null
---

## Context

PR #5658 removed the `Base`-pool hijacking from the trails-only describes in
`packages/activerecord/src/connection-handling.test.ts`, with one exception:
the `primary class connectedTo (after connectsTo) targets the Base-normalized
pool` case in `AbstractAdapter#isPreventingWrites stack matching`. It
establishes a pool with `{ owner: ApplicationRecord }`, and PoolConfig
normalizes that descriptor to the name `"Base"` — which IS the behaviour under
test — so the pool displaces the ambient worker pool. The describe's `afterEach`
therefore still calls `restoreWorkerConnection()` on every lane, which is the
last unconditional worker-pool re-establish in the file and is unsafe on the
in-memory lane (see
[[restore-worker-connection-yields-empty-db-on-in-memory-lane]]).

## Acceptance criteria

- The primary-class matcher assertion is exercised without displacing the
  ambient worker pool — e.g. on an isolated `ConnectionHandler` instance rather
  than `Base.connectionHandler`.
- The `afterEach` in that describe no longer calls `restoreWorkerConnection()`.
- Test names unchanged; `parity:test` delta for the file is non-negative.

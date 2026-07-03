---
title: "converge-pool-disconnect-discard-async"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["converge-connection-pool-lifecycle-async"]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of converge-connection-pool-lifecycle-async (RFC 0023). That story
lands the flush plus clearReloadable pool-lifecycle-async family. This story
carries the disconnect plus discard family, deferred because it cascades through
PoolConfig and roughly 30 test files via clearAllConnectionsBang, so it needs a
separate dep-serialized PR from main.

Converge in connection-pool.ts: make disconnect, disconnectBang, discardBang
async with the async-draining twins folded in and deleted (disconnectAsync,
discardBangAsync). Keep discardBangDraining as internal for the PoolConfig
batched-drain sweep. Update PoolConfig disconnect/discard surface and all
awaiting callers (connection-handler, tasks, the 30 test files).

Rails ConnectionPool disconnect-bang and discard-bang are synchronous; the async
return is an intentional documented divergence (driver close is async).

## Acceptance criteria

- disconnect, disconnectBang, discardBang become async; async twins deleted;
  discardBangDraining kept internal.
- All callers await; test names verbatim; test:compare non-negative; api:compare
  no regress. Single PR from main, no stacked PRs. No node imports, no process,
  async fs only, no new runtime deps.

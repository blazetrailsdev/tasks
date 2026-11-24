---
title: "reaper tests clear Reaper.pools under a live reaper thread (splice TypeError)"
status: ready
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The AR PostgreSQL and MariaDB CI logs (run 44937780462, run 44982183866) show this error from a reaper thread:

    #<Thread@AR Pool Reaper .../connection-pool/reaper.ts:47 dead> terminated with exception:
    TypeError: Cannot read properties of undefined (reading 'splice')
        at selectBang (activesupport/lib/array-utils.ts:18)
        at reaper.ts:56

`packages/activerecord/test/cases/reaper.test.ts:66-67`, `reaper.trails.test.ts:24-25` and `connection-pool.trails.test.ts:403-404` clear `Reaper.threads` / `Reaper.pools` while a spawned reaper `Thread` is still sleeping. When that thread wakes, `Reaper.pools.get(frequency)` is undefined. Rails' loop (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb:40-66`) never sees its `@pools[frequency]` removed from under it, because only the thread itself deletes it.

## Acceptance criteria

- Test teardown stops or joins each live reaper thread before it clears the registries, so no reaper thread dies with this TypeError. `reaper.ts` is not changed.
- No "AR Pool Reaper ... terminated with exception" appears in an AR lane log.

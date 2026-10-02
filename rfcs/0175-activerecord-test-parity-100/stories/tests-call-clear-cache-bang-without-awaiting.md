---
title: "Tests call clearCacheBang() without awaiting its promise"
status: draft
updated: 2026-10-02
rfc: "0175-activerecord-test-parity-100"
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

Rails' `clear_cache!` is synchronous
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`,
`@lock.synchronize { @statements.clear }`), and `bind_parameter_test.rb`'s statement-cache cases call
it and assert the cache on the next line.

trails' `AbstractAdapter#clearCacheBang`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`) returns
`void | Promise<void>`: with a statement pool it returns `this.lock.synchronize(...)`.
`packages/activerecord/src/bind-parameter.test.ts` calls `conn.clearCacheBang();` seven times
without `await` (`:103,111,119,133,150,167,180`) and then asserts the cache is empty. That only
holds because a monitor's uncontended entry runs its block before `synchronize` returns. PR #8360
broke that for one push (`ThreadLoadInterlockAwareMonitor` awaited `mon_enter` unconditionally) and
both the SQLite and PostgreSQL lanes went red at `bind-parameter.test.ts:112`. Other unawaited
callers: `base.test.ts:1580`, `migration/change-schema.test.ts:48`,
`migration/compatibility.test.ts:693,737`, `tasks/database-tasks.test.ts:318`.

## Acceptance criteria

- [ ] Every test call to `clearCacheBang()` whose result may be a promise is awaited.
- [ ] No test name or assertion changes.

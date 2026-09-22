---
title: "can_use_fast_cache_version? reads the global default_timezone, not the connection's"
status: draft
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Integration#can_use_fast_cache_version?` reads
`self.class.with_connection(&:default_timezone) == :utc`
(`vendor/rails/activerecord/lib/active_record/integration.rb:180-187`). trails'
`canUseFastCacheVersion` (`packages/activerecord/src/integration.ts`) reads the global
`ActiveRecord.defaultTimezone()` instead, so a connection configured with its own
`default_timezone` (`AbstractAdapter#defaultTimezone`, `abstract-adapter.ts`) is ignored.
The blocker: `cacheVersion` is a synchronous reader and `withConnection` is async; only a
sync lease (`withConnectionSync`, not blessed by CLAUDE.md § "Schema reflection peeks at a warm cache")
could serve it.

## Acceptance criteria

- `canUseFastCacheVersion` reads the leased connection's `defaultTimezone`, as Rails does.
- The `@missingRailsCall with_connection — CONVERGEABLE` receipt is removed.

---
title: "port Cache::Store instrumentation (ActiveSupport::Notifications)"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `Cache::Store` wraps every public operation with `ActiveSupport::Notifications.instrument` calls (cache.rb:1009–1029). For example:

- `fetch` fires `cache_fetch.active_support` (cache.rb:1009)
- `read` fires `cache_read.active_support`
- `write` fires `cache_write.active_support`
- `delete` fires `cache_delete.active_support`
- `exist?` fires `cache_exist?.active_support`
- `fetch_multi` fires `cache_fetch_multi.active_support`
- `read_multi` fires `cache_read_multi.active_support`

The instrumented block also sets payload attributes like `:super_operation`, `:hit`, `:key`. These notifications are part of the Rails public cache API and are used for monitoring and performance profiling.

Current `store.ts` has no instrumentation at all — the `instrument` helper is absent and none of the operations fire notifications.

This work is blocked on `ActiveSupport::Notifications` being ported (no story exists for that yet). File a notification-port prerequisite story first.

## Acceptance criteria

- Add an `instrument` protected method to `Store` that mirrors the Rails helper shape
- Wrap `fetch`, `read`, `write`, `delete`, `exist`, `readMulti`, `fetchMulti` with appropriate notification payloads
- Cover in tests: verify notification fires and payload includes `:key`
- api:compare delta non-negative; LOC ceiling ≤ 500

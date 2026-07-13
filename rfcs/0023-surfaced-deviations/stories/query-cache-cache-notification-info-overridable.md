---
title: "Make cache_notification_info overridable per connection"
status: claimed
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-13T20:12:35Z"
assignee: "query-cache-cache-notification-info-overridable"
blocked-by: null
---

## Context

Surfaced by the faithful port of `query_cache_test.rb`
(`converge-query-cache-one-schema`, PR #4340). trails builds the cached-hit
`sql.active_record` notification payload from a **module-level**
`cacheNotificationInfo`, invoked via `cacheNotificationInfoResult.call(this)`
in `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`
(~line 540/571) — not an overridable instance method. Rails' test overrides it
per-connection (`def connection.cache_notification_info; super.merge(neat: true);
end`, `vendor/rails/activerecord/test/cases/query_cache_test.rb:481`) and asserts
the cached event payload carries `neat: true` (`:490`); that override has no
effect in trails.

The `cache notifications can be overridden` case is `it.skip` (tracked) in
`packages/activerecord/src/query-cache.test.ts`.

## Acceptance criteria

- [ ] Dispatch the cached-hit notification payload through an overridable
      per-connection `cacheNotificationInfo` method so a subclass/instance
      override is honored.
- [ ] Un-skip `cache notifications can be overridden` in `query-cache.test.ts`
      and assert the override-injected key is present on the cached event.

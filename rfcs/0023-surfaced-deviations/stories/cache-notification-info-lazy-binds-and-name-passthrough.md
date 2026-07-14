---
title: "cacheNotificationInfo: lazy type_casted_binds + pass-through name"
status: claimed
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-14T16:38:40Z"
assignee: "cache-notification-info-lazy-binds-and-name-passthrough"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4847 (query-cache cacheNotificationInfo
overridable). trails' `cacheNotificationInfo`
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts`) builds
the cached-hit `sql.active_record` payload with two fidelity gaps vs Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:308-314`):

1. It eagerly computes `type_casted_binds: typeCastedBinds(binds)`, where Rails
   stores a **lambda** (`type_casted_binds: -> { type_casted_binds(binds) }`,
   query_cache.rb:311) so subscribers only pay the cast if they read the key.
2. It defaults `name` to `"SQL"` (`name: name ?? "SQL"`), where Rails passes
   `name` through unchanged (`name: name`, query_cache.rb:313).

Both were flagged twice in review as pre-existing and out of scope for #4847.

## Acceptance criteria

- [ ] `cacheNotificationInfo` stores `type_casted_binds` as a thunk/lazy value
      matching Rails' lambda semantics (cast deferred until the subscriber
      reads it), or documents why trails' notification consumers require the
      eager value.
- [ ] `name` is passed through unchanged rather than defaulting to `"SQL"`,
      matching query_cache.rb:313 — or the default is justified against a
      trails-specific consumer that requires a non-null name.
- [ ] A test asserts the payload shape for both (lazy binds + pass-through name)
      against a cached `sql.active_record` event.

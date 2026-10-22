---
title: "withConnectionSync: an overlapping promise block's deferred release checks in a connection still in use"
status: draft
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9043 made overlapping `withConnection` calls on an empty lease join one
pending checkout. `withConnectionSync` in
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`
still has the read-then-write shape with a promise arm. It acquires its
connection synchronously, but when `fn` returns a promise the release runs in
`result.finally(restore)`. A second call that enters while that promise is
pending sees `lease.connection` set and takes the no-release arm. The first
call's deferred release can then check the connection in while the second
call is still using it. Rails' `with_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:405-424`)
has one lease per thread, so this cannot happen there.

## Acceptance criteria

- Overlapping `withConnectionSync` calls whose blocks return promises release
  the lease once, after the last one settles. Either share `withConnection`'s
  pending-checkout holder count, or retire `withConnectionSync` under
  `with-connection-sync-is-a-lease-no-claude-md-section-ratifies`.
- A trails test pins it and fails on the current body.

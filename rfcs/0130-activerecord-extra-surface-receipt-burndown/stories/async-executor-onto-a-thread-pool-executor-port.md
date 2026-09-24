---
title: "Move AsyncExecutor out of activerecord as Concurrent::ThreadPoolExecutor"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: trails#8027
claim: "2026-09-24T13:07:19Z"
assignee: "test-bodies-lease-connection-per-test"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
`ar-config.ts` exports `AsyncExecutor` (with `post`), a stand-in for
`Concurrent::ThreadPoolExecutor`, which Rails builds at
`activerecord/lib/active_record.rb:286-294`
(`global_thread_pool_async_query_executor`) and
`connection_adapters/abstract/connection_pool.rb:716-726`
(`build_async_executor`). It is consumed by `active-record.ts` and
`connection-adapters/abstract/connection-pool.ts`.

The class is concurrent-ruby surface, not activerecord's: it belongs in the
package that mirrors concurrent-ruby (ruby-compat hosts `Thread`, `Mutex`,
`Monitor`), under the concurrent-ruby name, with activerecord importing it.

## Acceptance criteria

- `ThreadPoolExecutor` (with `post`) lives outside activerecord under the
  concurrent-ruby name; `ar-config.ts`'s `AsyncExecutor` is deleted and both
  call sites construct it with Rails' keyword options.

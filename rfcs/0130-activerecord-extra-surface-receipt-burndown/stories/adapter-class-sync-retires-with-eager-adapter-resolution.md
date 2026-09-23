---
title: "Resolve the adapter class eagerly so adapter_class is sync and adapterClassSync retires"
status: draft
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-sync-shim-permanent-receipts`. Rails'
`ConnectionHandling#adapter_class` is synchronous
(`activerecord/lib/active_record/connection_handling.rb`,
`connection_pool.db_config.adapter_class`), because
`DatabaseConfig#adapter_class` `require`s the adapter in line
(`database_configurations/database_config.rb:17`). trails resolves the
adapter with a dynamic `import()` (`connection-adapters.ts` `resolve`), so
`adapterClass()` is `async` and a second, sync twin exists:
`adapterClassSync` (`connection-handling.ts`, declared on `base.ts`), which
answers `null` while the import is pending. Its readers are
`sanitization.ts` (`column_name_matcher` arms), `relation.ts`
(`quoteColumnName`) and `attribute-methods/primary-key.ts`
`quotedPrimaryKey` — all synchronous in Rails.

Prior art `adapter-class-sync-swallows-the-pool-error-rails-raises` (done)
fixed its error arm; the twin itself remains. Related:
`lazy-adapter-driver-resolution`.

## Acceptance criteria

- The adapter class is resolved by the time `establish_connection` returns,
  so `adapterClass` answers synchronously as Rails' does, and
  `adapterClassSync` is deleted with its callers moved onto `adapterClass`.

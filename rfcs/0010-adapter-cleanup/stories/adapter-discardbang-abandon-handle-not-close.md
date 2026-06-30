---
title: "adapter-discardbang-abandon-handle-not-close"
status: done
updated: 2026-06-30
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4303
claim: "2026-06-30T01:35:35Z"
assignee: "adapter-discardbang-abandon-handle-not-close"
blocked-by: null
---

## Context

`PoolConfig#discardPoolBang` now routes through the pool's discard path (PR 4290),
so the adapter-level `discardBang()` semantics finally matter. They diverge from
Rails' `discard!` fd-abandonment contract:

- **PostgreSQL** — trails
  `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:2593`
  calls `conn.end()`, which actively closes the socket. Rails
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:394-397`)
  does `@raw_connection&.socket_io&.reopen(IO::NULL)` then `@raw_connection = nil`
  — it abandons the fd WITHOUT closing it, so a forked child can't disturb the
  parent's live server socket. `conn.end()` violates that contract.

- **MySQL (mysql2)** — trails has no `discardBang` override, so it inherits the
  no-op base (`abstract-adapter.ts:1626`, `discardBang(): void {}`). Rails
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:131-135`)
  sets `@raw_connection&.automatic_close = false` then `@raw_connection = nil`.
  trails neither disables auto-close nor nulls the raw handle.

Rails' abstract `discard!` (`abstract_adapter.rb:714`) is an empty hook
overridden by concrete adapters.

## Acceptance criteria

- [ ] PG `discardBang()` abandons the raw handle without closing the socket
      (node-postgres equivalent of `socket_io.reopen(IO::NULL)`), matching Rails.
- [ ] mysql2 adapter gains a `discardBang()` override that disables the driver's
      auto-close and nulls the raw connection, matching Rails.
- [ ] No regression to fork-safety / discard teardown tests.
- [ ] Confirm against Rails, not prior trails behavior.

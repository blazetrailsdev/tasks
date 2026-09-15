---
title: "Retire the trails-only awaitRawConnectionReady hook from withRawConnection (mysql2 is the last override)"
status: draft
updated: 2026-09-15
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
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

`AbstractAdapter#withRawConnection` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, the `run` closure) calls `await this.awaitRawConnectionReady()` right after the `connectBang` pre-check. That hook is trails-only: an empty `protected async awaitRawConnectionReady()` on AbstractAdapter, overridden only by `mysql2-adapter.ts` (~line 351) and also called directly from there (~line 346).

Rails' `with_raw_connection` (`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:985`) has no such step. It runs `connect! if @raw_connection.nil? && reconnect_can_restore_state?`, then `materialize_transactions`, then `verify!`.

trails#7787 removed the PostgreSQL override; PG now configures only through `connect!` / `verify!` / `reconnect!`. mysql2 is the last user.

## Converged shape

mysql2 builds its client in `connect` and configures it through `reconnectBang` / `verifyBang`, as PG now does. The hook and its call in `withRawConnection` are deleted.

## Acceptance criteria

- [ ] No `awaitRawConnectionReady` anywhere in `packages/activerecord/src`.
- [ ] The mysql2 connection and perform-query tests stay green on MariaDB.
- [ ] `pnpm parity:api:calls` is green.

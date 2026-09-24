---
title: "Base.connection's pool.active_connection arm returns nil like Rails; drop the non-null assertion"
status: ready
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 70
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ConnectionHandling#connection` (`activerecord/lib/active_record/connection_handling.rb:274-290`)
ends `else pool.active_connection end`, and `ConnectionPool#active_connection` returns `nil` when
the execution context holds no lease. So a non-permanent-lease read can answer `nil`.

Since trails#8021 the trails port (`packages/activerecord/src/connection-handling.ts`, `connection`)
is typed `Promise<DatabaseAdapter>` and writes that arm as `return pool.activeConnection!`. The
non-null assertion claims a value Rails does not promise, and callers never see the `nil` case in
the type. `Base.connection` is declared `Promise<DatabaseAdapter>` to match (`base.ts`, the
`declare static readonly connection` line).

## Acceptance criteria

- `connection` returns `Promise<DatabaseAdapter | null>` and the `!` is dropped, so the
  `pool.active_connection` arm can answer `null` as Rails' answers `nil`.
- `Base`'s `declare static readonly connection` follows. Callers that can reach the
  non-permanent arm with no lease narrow explicitly. The permanent-lease arm (`pool.leaseConnection()`)
  stays non-null.
- `connection-handling.test.ts` / `.trails.test.ts` stay green.

---
title: "withRawConnection pre-loop uses connectBang where Rails' connect! is verify!"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
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

Rails' `with_raw_connection` pre-loop runs `connect! if @raw_connection.nil? &&
reconnect_can_restore_state?` (vendor/rails/activerecord/lib/active_record/
connection_adapters/abstract_adapter.rb:985), and `connect!` is `verify!`
(abstract_adapter.rb:778-781) — the verify path handles unconfigured-connection
promotion and drives `reconnect!` with retries. trails'
`withRawConnection` (packages/activerecord/src/connection-adapters/
abstract-adapter.ts:2174) instead calls `connectBang()`, a bare
raw-connect primitive that skips verifyBang's unconfigured-promotion arm and
retry semantics. PR #5119 surfaced this while porting
`cases/disconnected_test.rb`: PG only reconnected because its `connectBang`
happens to eagerly open+configure, and sqlite (whose execute path bypasses
withRawConnection entirely) needed a bespoke `ensureConnected` guard calling
`verifyBang` directly (sqlite3-adapter.ts).

## Acceptance criteria

- `withRawConnection`'s pre-loop lazy-connect step routes through `verifyBang()`
  (Rails' `connect!` = `verify!`), not bare `connectBang()`.
- Existing disconnect/reconnect suites (adapter.test.ts AdapterConnectionTest,
  disconnected.test.ts, transactions.test.ts pool-removal cases) stay green on
  all three adapters.
- No behavior change for the verified/recently-active fast path.

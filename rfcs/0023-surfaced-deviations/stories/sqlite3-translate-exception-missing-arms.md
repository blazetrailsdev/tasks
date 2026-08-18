---
title: "sqlite3 translate_exception: restore the BusyException arm, drop the invented one, delegate the else to super"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into sqlite3-translate-exception-branch-set (same method / same subsystem; all Rails file:line citations carried into the surviving body)"
---

## Context

Surfaced while converging the `translate_exception` argument lists in PR #6370.

Rails' `SQLite3Adapter#translate_exception`
(`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:692-710`)
has six arms, in order: `RecordNotUnique`, `NotNullViolation`,
`InvalidForeignKey`, `ConnectionNotEstablished`, then

```ruby
elsif exception.is_a?(::SQLite3::BusyException)
  StatementTimeout.new(message, sql: sql, binds: binds, connection_pool: @pool)
else
  super
end
```

trails' `translateException`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, bottom of
file) diverges on both tails:

- **Missing arm.** No `BusyException` → `StatementTimeout` branch, so a lock
  timeout surfaces as a bare `StatementInvalid`. (`sqlite-retries-busy-handler-unported`
  under 0023 is closed and covers the retry/busy-handler machinery, not this
  classification arm.)
- **Extra arm.** A `ValueTooLong` branch on `/String or BLOB exceeded size limit/`
  that `sqlite3_adapter.rb` does not have — Rails reaches `ValueTooLong` only
  through the abstract translator, if at all.
- **No `super`.** The `else` returns `StatementInvalid` directly instead of
  delegating to `AbstractAdapter#translate_exception`
  (`connection_adapters/abstract_adapter.rb`), whose own `case` returns the
  exception unchanged for a `RuntimeError` / `ActiveRecordError` — so a trails
  `ActiveRecordError` raised from the driver callback gets re-wrapped where Rails
  passes it through.

## Converged shape

Six arms, in Rails' order, with the `BusyException` arm restored, the invented
`ValueTooLong` arm removed, and the `else` delegating to the abstract
translator so its `RuntimeError` / `ActiveRecordError` passthrough applies.

## Acceptance criteria

1. `translateException` mirrors `sqlite3_adapter.rb:692-710` arm for arm, in
   order.
2. A SQLite busy/lock error classifies as `StatementTimeout`, covered by a test
   that fails on the pre-change implementation.
3. An `ActiveRecordError` thrown from the driver callback comes back unchanged
   rather than wrapped in `StatementInvalid`.
4. `pnpm parity:api:calls` and the SQLite suites green.

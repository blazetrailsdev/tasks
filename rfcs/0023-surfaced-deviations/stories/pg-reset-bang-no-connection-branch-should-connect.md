---
title: "PG resetBang's no-connection branch runs super where Rails returns connect!"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `PostgreSQLAdapter#reset!`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:371-381`)
opens with:

```ruby
def reset!
  @lock.synchronize do
    return connect! unless @raw_connection
    ...
```

so with no raw connection the reset _reconnects_ (`connect!` is `verify!`,
`abstract_adapter.rb:778-781`) and never reaches `super`.

trails' `resetBang` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`)
instead does the opposite in that branch:

```ts
if (!this._rawConnection) {
  super.resetBang();
  return;
}
```

— it runs `super` (the branch Rails skips) and never connects. A pool checkin
on a torn-down adapter therefore leaves it unconnected where Rails would have
re-established and verified the connection; the gap is only masked because the
next checkout's `verifyBang` reconnects.

Pre-existing; surfaced during review of #6376 (RFC 0061
`pg-reset-body-under-one-lock`), which left the branch untouched.

## Acceptance criteria

- The no-connection branch calls `connectBang()` (trails' `connect!`) and
  returns, inside the lock, instead of dispatching to `super.resetBang()`.
- `resetBang` stays sync per `AbstractAdapter`; the connect hop is scheduled on
  the same lock the rest of the body uses (the shape #6376 established).
- A regression test pins that `resetBang()` on an adapter with no raw
  connection re-establishes it, and fails on the current baseline.
- PG lane green; `parity:api:calls` for `reset!` unchanged or improved.

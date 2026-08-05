---
title: "postgresql-active-issues-the-rails-liveness-query"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6119
claim: "2026-08-05T03:44:59Z"
assignee: "postgresql-active-issues-the-rails-liveness-query"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#active` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:238`)
answers from handle state only:

```ts
return this._rawConnection !== null && !this._closed && this._pgClientOptions != null;
```

Rails' `PostgreSQLAdapter#active?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:348`)
is a **live probe**:

```ruby
def active?
  @lock.synchronize do
    return false unless @raw_connection
    @raw_connection.query ";"
    verified!
    true
  rescue PG::Error
    false
  end
end
```

The probe half was previously impossible because `active` was a sync getter.
PR #5967 (story `converge-adapter-active-predicate-to-async`) flipped it to
`async active(): Promise<boolean>` on every adapter and folded the MySQL ping
into it, so the PG arm is now unblocked — it was deliberately left out of that
PR to keep the flip behavior-neutral on PG.

Cost to weigh: `active()` runs on every `verifyBang`, so adding `query ";"`
introduces a real round trip per verify and can inflate `assertQueries` counts
in ported tests (see the reflection-probe/`schemaQuery` precedent).

## Acceptance criteria

- `PostgreSQLAdapter#active` issues `query ";"` on the raw connection after the
  `@raw_connection` presence guard, calls `verifiedBang()`, and returns false on
  a PG error — matching `postgresql_adapter.rb:348`.
- The PG adapter test suite passes on the postgres lane, including any
  `assertQueries` counts that the extra round trip perturbs.

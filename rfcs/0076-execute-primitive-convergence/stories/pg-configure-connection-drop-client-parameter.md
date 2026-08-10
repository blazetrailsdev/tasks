---
title: "PG: make configureConnection argless, dropping the acquire-ordering client parameter"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6322
claim: "2026-08-10T02:46:35Z"
assignee: "port-test-date-conv-date-plus-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails' `PostgreSQLAdapter#configure_connection` is argless and operates on
`@raw_connection`:

```ruby
def configure_connection
  super
  ...
end
```

(`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:956`)

PR #6295 converged the trails hook toward that shape — the argless call now
configures the current raw connection, and `resetBang` dispatches through the
public hook per `reset!` (`postgresql_adapter.rb:371`) — but it kept an optional
parameter:

```ts
async configureConnection(client?: pg.Client): Promise<void> {
  const conn = client ?? this._rawConnection;
  ...
}
```

(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`)

The parameter exists because `_acquireFreshClient` must configure a
freshly-opened socket _before_ installing it as `_rawConnection`; Rails' libpq
`connect` assigns `@raw_connection` first, so no such window exists there.

This is the last piece of that story's deviation and is justified at the call
site today, but the signature still does not match Rails.

## Converged shape

Assign the fresh client to `_rawConnection` before dispatching
`configureConnection()`, the way Rails' `connect` assigns `@raw_connection`
before calling `configure_connection`, then drop the parameter entirely so the
hook is argless.

The blocker to check first: the acquire machinery holds `_acquiring` and the
configure queries must run on the raw socket rather than through
`withRawConnection` (see the deadlock comment at postgresql-adapter.ts ~828).
Installing `_rawConnection` earlier may expose a partially-configured socket to
a concurrent `withRawConnection` waiter — that interaction is the real work
here.

## Acceptance criteria

- [ ] `PostgreSQLAdapter#configureConnection` takes no parameters, matching
      postgresql_adapter.rb:956.
- [ ] `_acquireFreshClient` still configures before any query can use the
      socket, with no deadlock and no partially-configured socket observable to
      a concurrent waiter.
- [ ] adapter_test.rb:852 recovery test and the PG lifecycle suites
      (disconnected.test.ts, adapters/postgresql/connection.test.ts) stay green.
- [ ] If the acquire ordering genuinely cannot be inverted, `pnpm tasks block`
      with the specific interaction rather than re-justifying the parameter.

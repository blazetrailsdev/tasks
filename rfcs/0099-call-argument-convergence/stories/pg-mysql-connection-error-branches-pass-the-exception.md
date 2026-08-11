---
title: "PG and MySQL connection-error branches pass a message where Rails passes the driver exception"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6384
claim: "2026-08-11T23:06:01Z"
assignee: "converge-association-instance-get-to-rails-one-liner"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the `cause:` kwarg out of the PG and MySQL
translators (`call-args-pg-mysql-translate-exception-cause`, PR #6379). With
`cause:` gone, the remaining argument divergence in the same call sites is the
FIRST argument.

Rails' connection-error branches pass the driver EXCEPTION, not the message,
and `ConnectionFailed` gets no `sql:`/`binds:` at all:

`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:806-818`

```ruby
if exception.message.match?(/connection is closed/i) || exception.message.match?(/no connection to the server/i)
  ConnectionNotEstablished.new(exception, connection_pool: @pool)
elsif exception.is_a?(PG::ConnectionBad)
  if exception.message.end_with?("\n")
    ConnectionFailed.new(exception, connection_pool: @pool)
  else
    ConnectionNotEstablished.new(exception, connection_pool: @pool)
  end
```

and `abstract_mysql_adapter.rb:817-819`:

```ruby
when nil
  if exception.message.match?(/MySQL client is not connected/i)
    ConnectionNotEstablished.new(exception, connection_pool: @pool)
```

trails passes the message string plus `{ sql, binds }`:

- `connection-adapters/postgresql-adapter.ts` `_translateException` —
  `new ConnectionNotEstablished(msg)` / `new ConnectionFailed(msg, { sql, binds })`
- `connection-adapters/abstract-mysql-adapter.ts` `_translateException` —
  `new ConnectionNotEstablished(msg)`
- `connection-adapters/mysql2-adapter.ts` `_translateException` — same two shapes

The precedent for the converged form is already in the tree: sqlite3's
translator writes `new ConnectionNotEstablished(exception, { connectionPool: pool })`
(`sqlite3-adapter.ts`), so the constructor already accepts an Error first
argument and no language shortcoming is in play.

Two adjacent items to settle in the same pass:

- PG's `case "57P01"` (admin_shutdown → ConnectionNotEstablished) is a
  trails-only branch; Rails' `translate_exception` has no `57P01` case and
  falls through to `super`. Either cite why it must exist or drop it.
- `abstract-mysql-adapter.ts` attaches `connectionPool` only in the public
  `translateException` wrapper, where PG attaches it at the end of
  `_translateException` — so MySQL's direct `throw this._translateException(...)`
  sites raise errors with no pool, unlike Rails, where every branch passes
  `connection_pool: @pool` inside the translator itself.

## Converged shape

Each connection-error branch passes the driver exception as Rails does —
`new ConnectionNotEstablished(e, { connectionPool: this.pool })` — and
`ConnectionFailed` drops `sql`/`binds`, matching `:815`. The pool attachment
moves into `_translateException` in the MySQL adapters so the direct throw sites
carry it too.

`error.cause` continues to arrive from the raise-site attachment landed in
PR #6379; watch the assertions in `adapter.test.ts:427-472` and
`adapters/mysql2/mysql2-adapter.test.ts:340,353`, plus anything reading
`error.sql` off a ConnectionFailed, which is what the `sql:`/`binds:` drop is
likely to move.

## Acceptance criteria

- [ ] PG / abstract-mysql / mysql2 connection-error branches pass the exception,
      with `ConnectionFailed` carrying no `sql`/`binds`, cited to the lines above.
- [ ] The `57P01` branch is justified at the call site or removed.
- [ ] `connectionPool` is attached where Rails attaches it in the MySQL adapters.
- [ ] `pnpm parity:api:calls:args` green; PG and MySQL suites green.

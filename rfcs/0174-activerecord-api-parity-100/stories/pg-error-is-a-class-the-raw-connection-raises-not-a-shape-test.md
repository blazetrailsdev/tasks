---
title: "activerecord: PG::Error is a class the raw connection raises, not a shape test"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8744 added `PG.Error` (`vendor/pg/v1.5.9/lib/pg/exceptions.rb:9`) in
`packages/activerecord/src/pg/exceptions.ts` so `StatementPool#dealloc`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:307-316`)
and `cancel_any_running_query` (`postgresql/database_statements.rb:127-133`) can end in
`rescue PG::Error`.

It is not a class the driver's errors descend from. It is a `Symbol.hasInstance` test over a `WeakSet`
that `pgError` fills by the error's shape: a server error (`name === "error"` with a string `code`), one
of four connection-lost message substrings, a code matching `/^E([A-Z]+|AI_[A-Z]+)$/`, the message
"Query read timeout", or `connectionBad`. node-pg has no single error class, so:

- A node-pg client-side error with none of those shapes is not `PG::Error` and propagates where Rails
  rescues it.
- An error is only marked once it has passed through `pgError`, which runs in the wrapped `query`,
  `prepare` and `postgresql-adapter.ts`'s connect path. An error raised by another member of the raw
  connection is unmarked.
- `PG::ConnectionBad`, `PG::ServerError` and `PG::UnableToSend` (`ext/pg_errors.c:87-89`) are subclasses
  in the gem; here `ConnectionBad` is a second, separate `hasInstance` carrier.

## Acceptance criteria

- [ ] Every error the raw connection raises is constructed as, or rewrapped into, a `PG.Error` instance
      at the wrapper boundary in `pg/connection.ts`, with `ConnectionBad` a subclass, so `instanceof` is
      a class test and no message substring decides the class.
- [ ] `translateException` and the two `rescue PG::Error` sites keep passing their tests on PostgreSQL.

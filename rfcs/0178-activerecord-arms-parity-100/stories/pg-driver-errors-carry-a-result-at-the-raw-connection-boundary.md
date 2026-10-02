---
title: "activerecord: node-pg driver errors carry a result at the raw-connection boundary, as PG::Error does"
status: draft
updated: 2026-10-02
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed from the `blocked-by` of `pg-translate-exception-respond-to-result`, which names this as its
prerequisite and had no story for it.

Rails' `PostgreSQLAdapter#translate_exception`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:801-804`)
opens with one duck test and reads the SQLSTATE through it:

```ruby
return exception unless exception.respond_to?(:result)

case exception.result.try(:error_field, PG::PG_DIAG_SQLSTATE)
```

Every error the pg gem raises is a `PG::Error`, and `PG::Error` answers `result` (nil for a
connection-level failure such as `PG::ConnectionBad`, a `PG::Result` for a server error). So the one test
separates "the driver raised this" from everything else.

node-pg has no such carrier. Only pg-protocol's `DatabaseError` carries the SQLSTATE, as `.code`.
Connection-level failures are bare `Error`s: `pg/lib/client.js:180` builds
`new Error("Connection terminated")` / `"Connection terminated unexpectedly"`, and `:678,685` build
`"Client has encountered a connection error and is not queryable"` and
`"Client was closed and is not queryable"`. So `translateException`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1125-1140`) cannot ask one question.
It enumerates instead:

- `exception instanceof pg.DatabaseError`;
- `PostgreSQLAdapter._isConnectionError` (`:1589-1601`), which matches an `08…` code or one of four
  message substrings;
- `PostgreSQLAdapter._isConnectionClosedBeforeSend` (`:1603-1609`), two more message tests;
- a `noConnection` regexp pair hoisted above the guard.

That is the `instanceof` row `pnpm parity:api:duck-types` reports for `translateException`, and the two
message-matching helpers have no Rails counterpart.

Prior art: `adapter-connection-failure-error-classification` and
`pg-severed-connection-failed-vs-notestablished-libpq-signal` (both RFC 0023, done in trails#4935) settled
WHICH ActiveRecord error a severed connection maps to, and recorded that node-pg cannot reproduce libpq's
trailing-newline signal. This story does not reopen that mapping. It gives the errors one carrier so the
guard can be a duck test.

## Converged shape

**The stamp mutates the caught error in place. It does not wrap it.** The pg gem's `result` is an ivar
on the error object itself (`PG::Error#initialize(msg = nil, connection: nil, result: nil)` sets
`@result`, pg 1.6.3 `lib/pg/exceptions.rb:9-14`), and Rails hands that same object on as the `cause` of
the translated error. So the adapter defines a non-enumerable `result` property on the error node-pg
raised and re-throws that same object. Identity, `instanceof pg.DatabaseError`, `.code`, `.message` and
the stack are unchanged, so every existing `instanceof` and `cause` read elsewhere keeps working. A
wrapper would break those and would change what `cause` is.

The stamp is applied where a driver error crosses into trails. These are the three sites the blocked
story's `blocked-by` calls `connect`, `performQuery` and `prepare()`:

| `blocked-by` name | trails site                                                                                            | Rails                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `connect`         | `PostgreSQLAdapter.newClient` (`postgresql-adapter.ts:241`), which `connect` (`:1282`) awaits          | `new_client`, `postgresql_adapter.rb:56-71`              |
| `performQuery`    | `performQuery` (`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts:298`) | `perform_query`, `postgresql/database_statements.rb:135` |
| `prepare()`       | the module-level `prepare` (`postgresql-adapter.ts:210`), which `prepareStatement` (`:1268`) calls     | `prepare_statement`, `postgresql_adapter.rb:920`         |

`result` is nil for a connection-level error and answers `errorField` for a server error, reading the
SQLSTATE node-pg holds in `.code`. Where the pg gem's own class is what Rails tests
(`exception.is_a?(PG::ConnectionBad)`, `postgresql_adapter.rb:808`), the stamp records it, and the message
tests in `_isConnectionError` move to the one place that classifies a raw driver error.

**Vendoring the pg gem is out of scope, and the estimate does not include it.** This story wraps node-pg;
it mirrors no pg gem body, so the one fact it needs from the gem (`PG::Error` carries `result`) is cited
by gem version and path as above. If review asks for a vendored citation, adding the pg source to
`vendor/` (`vendor/sources.ts`, the lock file, `vendor/README.md` § "Upgrading a source") is filed as its
own story and this one takes a `deps` edge on it. It is not folded in here.

## Acceptance criteria

- [ ] An error raised by node-pg through `newClient`, `performQuery` or `prepareStatement` answers
      `result`; an `Error` raised anywhere else does not.
- [ ] The stamped error is the object node-pg raised (`===`), still `instanceof pg.DatabaseError` where it
      was, with `result` non-enumerable.
- [ ] `result` is nil for a connection-level failure and gives the SQLSTATE through `errorField` for a
      server error, with a test for each arm against a real connection.
- [ ] No message-substring classification of a driver error is left outside the stamping site.
- [ ] `translateException` is unchanged by this story except where the stamp replaces a helper call;
      converging its guard and `case` is `pg-translate-exception-respond-to-result`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` stay green,
      with no baseline row or receipt added.

## Verification

```bash
pnpm vitest run packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts packages/activerecord/src/adapters/postgresql/connection.test.ts
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:extra:gate
```

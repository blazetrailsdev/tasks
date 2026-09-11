---
title: "mismatchedForeignKey's sql-present arm returns a Promise where abstract_mysql_adapter.rb merges details synchronously"
status: ready
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#7676, which moved the mismatched-FK primary-key column lookup back
inside `mismatched_foreign_key_details`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:995`,
`options[:primary_key_column] = column_for(...)`).

trails' `columnFor` is async, so `mismatchedForeignKeyDetails`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`) now returns a
Promise. The sql-less arm is fine: the `query_parser` lambda resolves through
`MismatchedForeignKey#setQuery`, which `AbstractAdapter#log` awaits.

The **sql-present arm** of `mismatchedForeignKey` diverges. Rails
(`abstract_mysql_adapter.rb:1001-1015`) merges the details synchronously and returns a
`MismatchedForeignKey`:

```ruby
if sql
  options.update mismatched_foreign_key_details(message: message, sql: sql)
else
  options[:query_parser] = ->(sql) { mismatched_foreign_key_details(message: message, sql: sql) }
end
MismatchedForeignKey.new(**options)
```

trails returns `Promise<MismatchedForeignKey>` from that arm, so `translate_exception`, and
through it `translateExceptionClass`, can hand back a Promise rather than an exception.
`translateExceptionClass` applies `set_backtrace` / cause to the resolved value
(`abstract_adapter.rb:1121-1131`). But `withRawConnection` and `reconnectBang` `throw` the
translated value directly, so a Promise reaching them would be thrown as-is. Today mysql
always translates with `sql = null` (`abstract-adapter.ts` `translateExceptionClass(e, null, null)`
call sites), so the arm is reachable only from tests. That invariant is unenforced.

## Converged shape

`mismatchedForeignKey` returns a `MismatchedForeignKey` synchronously on both arms, as
`abstract_mysql_adapter.rb:1001-1015` does. The likely route is a synchronous
primary-key column read on the details path: the target table's columns from the schema
cache, when the table has been reflected. The alternative is making the exception-translation
path awaitable end to end (RFC 0076 territory). Do not keep the Promise arm by documenting it.

## Acceptance criteria

- [ ] `mismatchedForeignKey`'s sql-present arm returns a `MismatchedForeignKey`, not a Promise.
- [ ] `translateExceptionClass` has no `instanceof Promise` branch.
- [ ] `mysql2-adapter.mismatched-fk-enrichment.trails.test.ts` still pins the message, stack
      and cause for both arms; MariaDB lane green.

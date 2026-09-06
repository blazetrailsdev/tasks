---
title: "Remove mysql2's invented _translateAndEnrich wrapper; the enrichment is Rails' query_parser lambda"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 39
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7504, which closed `remove-invented-translate-exception-helper`
by deleting `_translateException` and routing every adapter through Rails'
`translate_exception_class`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1122-1132`).

Mysql2 has a _second_ trails-invented wrapper on the same path that the story
did not cover, `_translateAndEnrich`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:415`), called
from eight sites (`:321`, `:324`, `:475`, `:478`, `:514`, `:517`, `:619`,
`:622`):

```ts
private async _translateAndEnrich(e: unknown, sql: string, binds: unknown[]): Promise<Error> {
  let translated = this.translateExceptionClass(e, sql, binds) as Error;
  if (translated instanceof MismatchedForeignKey) {
    translated = translated.setQuery(sql, binds);
  }
  if (translated instanceof MismatchedForeignKey) {
    translated = await this._enrichMismatchedForeignKey(translated);
  }
  if (translated instanceof AdapterError) translated.setConnectionPool(this.pool);
  return translated;
}
```

Rails has none of the three post-steps as a separate pass:

- The `sql`/`binds` and `connection_pool` it re-applies are already constructor
  kwargs on every error `translate_exception` builds
  (`abstract_mysql_adapter.rb:824-853`), and `log`'s rescue is the one place
  Rails re-stamps a query — `raise ex.set_query(sql, binds)`,
  `abstract_adapter.rb:1145-1148`, which trails already ports at
  `abstract-adapter.ts`'s `log`.
- The MismatchedForeignKey enrichment is Rails' `query_parser` lambda, handed to
  the error at construction and run lazily by the error itself
  (`abstract_mysql_adapter.rb:1012`, `MismatchedForeignKey#initialize` in
  `activerecord/lib/active_record/errors.rb`). trails already builds that lambda
  in `mismatchedForeignKey`, so `_enrichMismatchedForeignKey` is a second,
  eager implementation of the same thing.

Its eight call sites are also wrapped in an invented `e.cause ?? e` ternary that
picks which exception to translate, which Rails does not do either.

## Converged shape

`_translateAndEnrich` is removed. The eight call sites throw
`this.translateExceptionClass(e, driverSql, binds)` directly, the way sqlite3
and postgresql do after #7504; `MismatchedForeignKey` reaches its details
through the `queryParser` lambda `mismatchedForeignKey` already gives it, and
`connectionPool` through the constructor kwarg. `_enrichMismatchedForeignKey`
goes with it unless a call site is left that Rails genuinely has.

Whether the `e.cause ?? e` unwrapping is load-bearing for node-mysql2 (which
nests driver errors) should be settled at the same time: if it is, it belongs
inside `translateException`'s own arms, not in a wrapper around the Rails entry
point.

## Acceptance criteria

- [ ] `_translateAndEnrich` no longer exists; all eight call sites go through
      `translateExceptionClass`.
- [ ] `MismatchedForeignKey` raised through mysql2 still carries its table /
      foreign_key / target_table / primary_key details, resolved through the
      `queryParser` lambda.
- [ ] `pnpm parity:api:extra --package activerecord` novel count does not grow;
      `parity:api:calls` / `:args` green.
- [ ] The MariaDB lane's mysql2 adapter suites are green.

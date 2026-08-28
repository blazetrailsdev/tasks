---
title: "arel: SQLString invents preparable/retryable defaults where Rails leaves them nil"
status: done
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7140
claim: "2026-08-27T23:29:14Z"
assignee: "alias-predication-as-return-widened-to-node"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Collectors::SQLString` declares `attr_accessor :preparable, :retryable`
(`vendor/rails/activerecord/lib/arel/collectors/sql_string.rb:8`) and
`initialize` sets only `@bind_index = 1` (sql_string.rb:10-13), so a fresh
`SQLString` has `preparable == nil` and `retryable == nil`.

`packages/arel/src/collectors/sql-string.ts:9-10` invents defaults:

```ts
preparable = false;
retryable = true;
```

A caller that reads `collector.retryable` before the visitor has written it
therefore sees `true` in trails and `nil` in Rails —
`database-statements.ts:240` returns `collector.retryable` straight out of
`toSqlAndBinds`, which is Rails' `allow_retry = collector.retryable`
(`abstract/database_statements.rb`), so the invented default is load-bearing
in a way Rails' `nil` is not.

PR #7123 (RFC 0124, `arel-collectors-and-grouping-invented-guards`) removed the
matching invented default on `Composite#preparable` but left this sibling
untouched because it was outside that story's acceptance criteria.

## Converged shape

```ts
preparable?: boolean;
retryable?: boolean;
```

with no initializer, mirroring sql_string.rb:8. Then audit the readers —
`connection-adapters/abstract/database-statements.ts:237-240,328-331` and
`visitors/to-sql.ts` (which only ever writes `false`) — and make each one
handle the `undefined` that Rails handles as `nil`, rather than restoring the
default at the field.

## Acceptance criteria

- `SQLString#preparable` and `#retryable` have no initializer.
- Every reader of a freshly-constructed collector's `retryable` / `preparable`
  is checked against Rails' `nil` semantics and cited at the call site.
- `collectors/sql-string.test.ts`, `collectors/composite.test.ts`,
  `connection-adapters/abstract/database-statements` tests stay green; no test
  renamed.

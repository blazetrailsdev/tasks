---
title: "mysql2 computes two bind conversions where Rails computes one"
status: draft
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `raw_execute` computes the type-casted binds **once** and hands the same
array to both the payload producer and the driver:

```ruby
def raw_execute(sql, name = nil, binds = [], prepare: false, ...)
  type_casted_binds = type_casted_binds(binds)
  log(sql, name, binds, type_casted_binds, async: async) do |notification_payload|
    with_raw_connection(...) do |conn|
      perform_query(conn, sql, binds, type_casted_binds, ...)
    end
  end
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`.)

`Mysql2Adapter` computes **two different** conversions of the same binds:

- `driverBinds = this.mysqlBinds(binds)` — what actually reaches mysql2.
- `typeCastedBinds = this.typeCastedBinds(binds)` — what the payload's
  `type_casted_binds` slot reports.

All four query paths do this (`mysql2-adapter.ts`, `internalExecQuery` /
`execute` / `executeMutation` / `internalExecute`). `mysqlBinds`
(`mysql2-adapter.ts:866`) unwraps `valueForDatabase` and then applies driver
wire conversion (Temporal → SQL string, etc.) on top of what `type_cast`
already does, so the two arrays can disagree — and when they do, the payload
describes values the driver never saw.

Surfaced while converging the payload producers onto `AbstractAdapter#log`
(PR #6293). That PR deliberately took the payload slot from
`typeCastedBinds(binds)` — Rails' definition of the slot — rather than from
`driverBinds`, which left the two-conversion split in place as the remaining
deviation.

## Converged shape

One conversion per query, computed once and passed to both `log` and the
driver call, as in `database_statements.rb:553-559`. Either `mysqlBinds`
becomes the adapter's `type_cast`/`type_casted_binds` implementation (so
`typeCastedBinds(binds)` already yields the driver form), or its extra wire
normalization moves into the MySQL `type_cast` override
(`mysql/quoting.rb:96-115`) where Rails puts it.

## Acceptance criteria

- [ ] Each mysql2 query path computes the type-casted binds once and passes
      that same array to `log` and to `_performQuery`.
- [ ] `mysqlBinds` is gone, or is the `type_cast` implementation rather than a
      parallel conversion.
- [ ] Payload `type_casted_binds` is byte-identical to what mysql2 received.
- [ ] MySQL/MariaDB CI green; parity:test / parity:api delta non-negative.

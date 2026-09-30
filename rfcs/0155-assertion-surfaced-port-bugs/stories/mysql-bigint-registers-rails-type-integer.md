---
title: "MySQL bigint registers Rails' Type::Integer(limit: 8); delete MysqlBigInteger"
status: draft
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
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

Rails registers MySQL `bigint` as a plain integer type:
`register_integer_type m, %r(^bigint)i, limit: 8`, which builds
`Type::UnsignedInteger.new(**options)` or `Type::Integer.new(**options)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:725,735-743`).

trails' `AbstractMysqlAdapter.registerIntegerType`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`)
returns an invented `MysqlBigInteger extends BigIntegerType` for `limit: 8`.
It was added in #4240 so that 64-bit range checks use BigInt arithmetic
(`2^63` vs `2^63 - 1` collapse to one float64). Because the class has no Rails
name, #8254 had to add `dumpTags.set(MysqlBigInteger, "!ruby/object:ActiveModel::Type::Integer")`
so a dumped record still carries Rails' tag (MariaDB lane,
`yaml-serialization.test.ts` "types of virtual columns are not changed on round trip").

## Converged shape

`registerIntegerType` returns `new IntegerType(options)` for every signed limit,
as Rails does. `ActiveModel::Type::Integer`
(`activemodel/lib/active_model/type/integer.rb:49-110`) does the BigInt-precise
range check itself when `limit` is 8: `max_value` / `min_value` and
`ensure_in_range` use BigInt once `_limit * 8 - 1 > 52`. `MysqlBigInteger` and
its `dumpTags` entry are deleted.

## Acceptance criteria

- [ ] `registerIntegerType` returns `IntegerType` / `UnsignedInteger` only, as `abstract_mysql_adapter.rb:735-743` does.
- [ ] `MysqlBigInteger` and `dumpTags.set(MysqlBigInteger, …)` are deleted.
- [ ] `OrTest#or with large number` and the MariaDB/MySQL `yaml-serialization.test.ts` lane stay green.

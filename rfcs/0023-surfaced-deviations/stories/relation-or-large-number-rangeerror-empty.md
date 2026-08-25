---
title: "relation-or-large-number-rangeerror-empty"
status: done
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - relation-or-fold-quadratic-perf
deps-rfc: []
est-loc: null
priority: 92
pr: 4240
claim: "2026-06-28T19:06:33Z"
assignee: "relation-or-large-number-rangeerror-empty"
blocked-by: null
---

## Context

Rails `OrTest#test_or_with_large_number` (or_test.rb:35) does
`Post.where(id: 1).or(Post.where(id: 9223372036854775808))` and expects
`[posts(:welcome)]` (id 1). `2^63` overflows the `id` bigint column; Rails
serializes the bind, raises `ActiveRecord::RangeError`, and
`ConnectionAdapters::DatabaseStatements#select_all` rescues it returning
`ActiveRecord::Result.empty` (database_statements.rb:78). So the overflow side
yields no rows and the OR collapses to `id = 1`.

trails has neither half of this: (1) the bound `2^63` BigInt bypasses the
integer type's `ensureInRange` (activemodel `type/integer.ts` / `big-integer.ts`
range check is `number`-typed and doesn't catch the BigInt), so no client-side
`RangeError` is raised; and (2) `selectAll`
(`connection-adapters/abstract/database-statements.ts:1520`) has no `RangeError`
→ empty-result rescue. On PG/MySQL the out-of-range value reaches the wire and
the adapter raises (`value "9223372036854775808" is out of range for type
bigint`), poisoning the open transaction. SQLite is untyped so the query runs
and the result happens to match.

`relation/or.test.ts` (PR #4178) skips `or with large number` on non-sqlite
lanes (`it.skipIf(adapterType !== "sqlite")`) pending this convergence.

- trails: `packages/activemodel/src/type/integer.ts` (`ensureInRange`/`isInRange`),
  `type/big-integer.ts`; `packages/activerecord/src/connection-adapters/abstract/database-statements.ts` (`selectAll`, line 1520); bind serialization (`toSqlAndBinds`).
- Rails: `activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:69-80` (`select_all` rescue), `activemodel/lib/active_model/type/integer.rb` (`ensure_in_range`), `errors.rb:301` (`RangeError < StatementInvalid`).

## Acceptance criteria

- [ ] An out-of-range bound integer raises `RangeError` (StatementInvalid subclass) client-side during bind serialization, before reaching the adapter wire — for both `number` and `BigInt` values, on sqlite/PG/MySQL.
- [ ] `selectAll` (and the `selectOne`/`selectValue`/`selectRows` it backs) rescues `RangeError` → empty result, mirroring `database_statements.rb:78`.
- [ ] `relation/or.test.ts` `or with large number` runs and passes on ALL adapter lanes; drop the `skipIf` guard.
- [ ] No PG transactional-fixtures poisoning (the bind never reaches the wire).

---
title: "Restore Rails' out-of-range middle assertion in bind_params_to_sql"
status: done
updated: 2026-08-01
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 5783
claim: "2026-08-01T01:43:46Z"
assignee: "restore-bind-params-to-sql-out-of-range-assertion"
blocked-by: null
closed-reason: null
---

## Context

`assert_bind_params_to_sql` in `packages/activerecord/src/bind-parameter.test.ts`
omits the **middle** of Rails' three assertions
(`vendor/rails/activerecord/test/cases/bind_parameter_test.rb:228-231`):

```ruby
sql = "SELECT #{table}.* FROM #{table} WHERE #{pk} IN (#{bind_params(1..3)})"
authors = Author.where(id: [1, 2, 3, 9223372036854775808])
assert_equal sql, @connection.to_sql(authors.arel)
assert_queries_match(sql) { assert_equal 3, authors.length }
```

It asserts an over-range integer (2\*\*63) is dropped from the `IN` list. In place
of it the trails file carries a prose comment deferring to story
`array-where-integer-range-exclusion`.

That story is now **done**, so the comment is stale. The mechanism it was waiting
on is in place: `array-handler.ts:75-80` routes the multi-value case through
`Nodes.HomogeneousIn`, whose `castedValues` (`packages/arel/src/nodes/homogeneous-in.ts:59-79`)
skips values failing `typeCaster.isSerializable` and drops null serializations —
exactly the Rails drop-out-of-range behavior the comment says is missing.

Surfaced while merging #5779 (which fixed the _third_ assertion's MySQL
string-cast branch and did not touch this one).

## Acceptance criteria

- Restore Rails' middle assertion verbatim in `assertBindParamsToSql`, between
  the existing first and third assertions.
- Delete the stale deferral comment naming `array-where-integer-range-exclusion`.
- If `castedValues` turns out not to drop `2n**63n` for the `id` attribute's type
  caster, fix that path rather than re-deferring; note that JS needs `bigint`
  where Ruby has arbitrary-precision `Integer`.
- Green on sqlite3, postgresql, plain mysql2, and `MYSQL_PREPARED_STATEMENTS=1`
  (the whole test is gated on `conn.preparedStatements`, so MySQL only exercises
  it on the prepared lane).
- Do NOT rename the test.

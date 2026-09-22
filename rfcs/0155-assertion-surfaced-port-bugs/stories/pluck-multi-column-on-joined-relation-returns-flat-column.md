---
title: "pluck-multi-column-on-joined-relation-returns-flat-column"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: ["sqlite3-perform-query-positional-result"]
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

Surfaced converging `calculations_test.rb` assertions for
`assertions-tail-root-7`.

`Relation#pluck` with more than one column on a JOINED relation returns a flat
single-column array where Rails returns an array of tuples.

Rails (`vendor/rails/activerecord/test/cases/calculations_test.rb:1190-1200,1283-1293`):

```ruby
assert_equal [[2, 2], [4, 4]], Reply.includes(:topic).order(:id).pluck(:id, topics: [:id])
assert_equal [[2, 2], [4, 4]], Reply.includes(:topic).order(:id).pluck(:id, topics: :id)
assert_equal [[2, 2], [4, 4]], Reply.includes(:topic).order(:id).pluck(:id, :"topics.id")

assert_equal [[2, 1], [4, 3]], Reply.includes(:topic).order(:id).pluck(:id, topic: [:id])

topics = Topic.joins(:replies).order(:id)
assert_equal [[1, 2], [3, 4]], topics.pluck("topics.id", "replies.id")
```

trails returns `[2, 4]` for each of those — one column, flattened — instead of
the pairs. Probed directly on `origin/main` (sqlite3):

```text
Reply.includes(":topic").order("topics.id").pluck("id", { topics: ["id"] })  => [2, 4]
Reply.includes(":topic").order("topics.id").pluck("id", "topics.id")         => [2, 4]
Topic.joins(":replies").order("topics.id").pluck("topics.id", "replies.id")  => [2, 4]
```

A second, independent divergence sits in the same tests: Rails' `order(:id)` on
a joined relation is qualified to the model's table, trails' `order("id")`
emits a bare `ORDER BY id`, which SQLite rejects with
`ambiguous column name: id` once the join is present. `Relation#toSql` on
`Reply.includes(":topic").order("id")` is
`... ORDER BY id`, where Rails emits `ORDER BY "topics"."id"`.

Parked in `packages/activerecord/src/calculations.test.ts` with converged
bodies and a `BLOCKED:` line:

- `pluck with join`
- `pluck with join alias`
- `pluck with qualified name on loaded`

Rails source: `activerecord/lib/active_record/relation/calculations.rb`
(`pluck`, `type_cast_pluck_values`) and
`activerecord/lib/active_record/relation/query_methods.rb`
(`preprocess_order_args`, `arel_column`).

## Acceptance criteria

- [ ] Multi-column `pluck` on a joined relation returns one tuple per row, in
      column order, for the string, symbol-hash and bare-hash spellings above.
- [ ] `order("id")` on a relation with a join is qualified to the model's table.
- [ ] The three parked tests in `calculations.test.ts` are un-skipped and pass
      with their converged bodies unchanged.

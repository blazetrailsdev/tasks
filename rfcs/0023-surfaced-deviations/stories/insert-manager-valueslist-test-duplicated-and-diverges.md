---
title: "insert-manager-valueslist-test-duplicated-and-diverges"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4873 (arel-raw-value-dispatch-raises-like-rails).

`packages/arel/src/insert-manager.test.ts` has `can create a ValuesList node`
**twice, verbatim** — at `:8` and `:168` — same body, same assertions. Since
`test:compare` matches our tests to Rails' by name, the duplicate cannot
improve the mapping and one copy is pure noise.

Both copies also diverge from the Rails test they are named after. Rails'
(`vendor/rails/activerecord/test/cases/arel/insert_manager_test.rb:8-14`):

```ruby
it "can create a ValuesList node" do
  manager = Arel::InsertManager.new
  values  = manager.create_values_list([%w{ a b }, %w{ c d }])

  assert_kind_of Arel::Nodes::ValuesList, values
  assert_equal [%w{ a b }, %w{ c d }], values.rows
end
```

It asserts **node structure** — kind and `rows` — and never compiles to SQL.
Ours builds an `InsertManager`, sets `ast.columns`, and asserts a rendered
`INSERT INTO ... VALUES (...)` string, which is a different test wearing the
Rails name. PR #4873 fixed the rows themselves (they wrapped values in
`Quoted`, input Rails would `TypeError` on; they now carry raw values like
Rails') but deliberately left the duplication and the assertion shape alone as
out of scope.

Note `insert_manager_test.rb` currently shows 1 Miss in `test:compare`, so
there may be a related unported test in the same file worth picking up here.

## Acceptance criteria

- [ ] The duplicate `can create a ValuesList node` is removed — one copy only.
- [ ] The surviving copy ports Rails' assertions: `kind_of` ValuesList and
      `rows` equality, per `insert_manager_test.rb:8-14`. If the SQL-rendering
      assertion is worth keeping, it moves to a separate test whose name does
      not collide with a Rails test.
- [ ] Test name unchanged (`can create a ValuesList node`).
- [ ] Check the 1 Miss reported for `insert_manager_test.rb` and port it if it
      belongs to this cluster.
- [ ] test:compare delta for `insert_manager_test.rb` non-negative.

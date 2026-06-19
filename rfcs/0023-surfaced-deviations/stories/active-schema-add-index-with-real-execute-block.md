---
title: "active-schema add_index test omits with_real_execute index_exists/if_not_exists block"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-19T15:36:28Z"
assignee: "active-schema-add-index-with-real-execute-block"
blocked-by: null
---

## Context

The trails port of `ActiveSchemaTest#test_add_index`
(`packages/activerecord/src/adapters/abstract-mysql-adapter/active-schema.test.ts`,
"add index") omits the `with_real_execute` block Rails runs in the middle of
the test (Rails `vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/active_schema_test.rb:66-73`):

```ruby
with_real_execute do
  add_index(:people, :first_name)
  assert index_exists?(:people, :first_name)
  assert_nothing_raised do
    add_index(:people, :first_name, if_not_exists: true)
  end
end
```

This exercises real `add_index` execution + `index_exists?` introspection +
the `if_not_exists: true` pre-flight (the MySQL `indexExists` short-circuit in
`connection-adapters/mysql/schema-statements.ts:59-61`). The rest of the test
asserts generated SQL under stub mode (PR #3646), but this block must use real
execution against the canonical `people` table.

Surfaced during review of PR #3646 (capturesql-stub-execute-mysql-active-schema).

## Acceptance criteria

- [ ] "add index" test ports the `with_real_execute` block: real
      `addIndex("people", "first_name")`, assert the index exists, then
      `addIndex("people", "first_name", { ifNotExists: true })` raises nothing.
- [ ] Real execution path: do NOT pass `{ stub: adapter }` for this block;
      use the canonical `people` table and tear down the created index.
- [ ] Test name "add index" unchanged; no test:compare regression.

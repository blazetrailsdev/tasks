---
title: "all-queries-scoping-not-applied-to-delete"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scoping(all_queries: true)` does not reach `Persistence#delete` in trails, where Rails applies the
scope to the DELETE statement.

Rails
(`vendor/rails/activerecord/test/cases/scoping/relation_scoping_test.rb:378-393`,
`test_scoping_applies_to_delete_with_all_queries`):

```ruby
Author.where(organization_id: 1).scoping(all_queries: true) do
  delete_scoped_sql = capture_sql { dev2.delete }.first
  assert_match(/organization_id/, delete_scoped_sql)
end
```

Porting that assertion onto trails reds it — the captured statement is
`DELETE FROM "authors" WHERE "authors"."id" = 3`, with no `organization_id` term:

```text
AssertionError: expected 'DELETE FROM "authors" WHERE "authors"…' to match /organization_id/
```

The sibling arms DO work, so the gap is specific to `delete`, not to `all_queries` scoping
generally: the same test file's `scoping applies to update with all queries` and
`scoping applies to reload with all queries` were both converged onto Rails' `capture_sql` +
`assert_match(/organization_id/)` shape in the RFC 0132 PR and pass, as does
`scoping applies to all queries on has many when set`.

Rails reaches the scope through `Persistence#delete` -> `_delete_row` ->
`self.class._delete_record`, which builds its constraint from the current scope when
`all_queries` is set. Compare trails' `delete` / `_deleteRow` /
`_deleteRecord` in `packages/activerecord/src/persistence.ts` against
`activerecord/lib/active_record/persistence.rb`.

Because the Rails assertion cannot pass yet, `packages/activerecord/src/scoping/relation-scoping.test.ts`
still asserts the old behavioural shape (`Author.exists(...)` is false afterwards) for that one
test, which is why `relation_scoping_test.rb` reports 1 assertion mismatch
(`equal rails 0 vs trails 2, match rails 1 vs trails 0, noMatch rails 1 vs trails 0`).

## Acceptance criteria

- `scoping(all_queries: true)` applies the current scope to a record `delete`, so the DELETE
  statement carries the scope's conditions as it does in Rails.
- `scoping applies to delete with all queries` is ported onto Rails' `capture_sql` +
  `assert_no_match` / `assert_match` shape and passes, taking
  `scoping/relation_scoping_test.rb` to 0 assertion mismatches.
- No test renames.

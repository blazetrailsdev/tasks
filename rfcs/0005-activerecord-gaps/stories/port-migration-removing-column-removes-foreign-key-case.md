---
title: "Port the orphaned 'removing column removes foreign key' case"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5490
claim: "2026-07-28T13:10:15Z"
assignee: "port-migration-removing-column-removes-foreign-key-case"
blocked-by: null
closed-reason: null
---

## Context

`parity:test --package activerecord` reports `17 OK / 6 missing` for
`migration/references_foreign_key_test.rb` after PR #5482 merged. Five of the six
missing cases are owned by
`port-migration-references-foreign-key-naming-and-conditional-cases`
(pluralize_table_names, if_exists, if_not_exists, prefix, suffix).

The sixth — `removing column removes foreign key`
(`vendor/rails/activerecord/test/cases/migration/references_foreign_key_test.rb:154-162`)
— is owned by nobody. It belongs to the `ReferencesForeignKeyTest` class, so it
was in the scope of `port-migration-references-foreign-key-cases` (PR #5477), but
it was dropped from that PR before merge and never re-registered. The sibling
case `foreign key column can be removed` did land, at
`packages/activerecord/src/migration/references-foreign-key.test.ts:89`.

Rails:

```ruby
test "removing column removes foreign key" do
  @connection.create_table :testings do |t|
    t.references :testing_parent, index: true, foreign_key: true
  end

  assert_difference "@connection.foreign_keys('testings').size", -1 do
    @connection.remove_column :testings, :testing_parent_id
  end
end
```

The distinction from the already-ported case is the removal verb: this one calls
`remove_column` directly rather than `remove_reference`, exercising whether the
adapter drops the dependent foreign key along with the column (a real difference
on SQLite, where `removeColumn` goes through the alter-table rebuild path).

## Acceptance criteria

- [ ] `removing column removes foreign key` lives under the describe path
      `Migration > ReferencesForeignKeyTest` in
      `packages/activerecord/src/migration/references-foreign-key.test.ts`,
      name matching Rails verbatim.
- [ ] The case asserts the foreign-key count drops by exactly 1 across the
      `removeColumn` call, mirroring Rails' `assert_difference ... -1`.
- [ ] `parity:test --package activerecord` shows
      `migration/references_foreign_key_test.rb` missing drop from 6 to 5;
      `--gates --check` exits 0.
- [ ] Passes on all three lanes (sqlite / pg / mysql), or the reason it cannot
      is a documented Rails-backed adapter gate rather than a skip.

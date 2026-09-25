---
title: "AssociationScope last/next_chain_scope: Rails locals, zip shape, no aliased_table fallback chain"
status: draft
updated: 2026-09-25
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8074 deleted the two invented `CompositePrimaryKeyMismatchError` guards
from `AssociationScope#last_chain_scope` / `#next_chain_scope`. The bodies
around them are still not line-for-line with Rails
(`vendor/rails/activerecord/lib/active_record/associations/association_scope.rb:58-100`):

```ruby
def last_chain_scope(scope, reflection, owner)
  primary_key = Array(reflection.join_primary_key)
  foreign_key = Array(reflection.join_foreign_key)

  table = reflection.aliased_table
  primary_key_foreign_key_pairs = primary_key.zip(foreign_key)
  primary_key_foreign_key_pairs.each do |join_key, foreign_key|
    value = transform_value(owner._read_attribute(foreign_key))
    scope = apply_scope(scope, table, join_key, value)
  end
  ...
```

`packages/activerecord/src/associations/association-scope.ts`
(`lastChainScope`, `nextChainScope`) diverges in three ways:

- **Locals.** `joinPks` / `joinFks` / `rJoinPk` / `tableName` stand where
  Rails has `primary_key` / `foreign_key` / `table` /
  `primary_key_foreign_key_pairs`.
- **Iteration.** Index loops (`for (let i = 0; i < joinPks.length; i++)`, and
  a seeded `constraints` plus a loop from `i = 1`) stand where Rails does
  `zip(...).each` and `zip(...).map { ... }.inject(&:and)`.
- **Invented fallback.** `reflection.aliased_table` is read through a
  string / `{ name }` / `try { klass.tableName } catch` chain. Rails has no
  such chain: `aliased_table` is always a table (`reflection.rb`
  `RuntimeReflection#aliased_table`, `ReflectionProxy#aliased_table` in
  `association_scope.rb:118-134`).

## Acceptance criteria

- Both methods read with Rails' locals and shape: `primaryKey` / `foreignKey`
  from `Array(...)`, `table = reflection.aliasedTable`, and a
  `primaryKeyForeignKeyPairs` zip that is iterated (`last`) and mapped and
  and-reduced (`next`).
- The `aliasedTable` fallback chain is deleted. `RuntimeReflection` /
  `ReflectionProxy` return a table, as Rails' do.
- `association-scope.trails.test.ts` and the association suites stay green on
  all three adapter lanes. `pnpm parity:api:calls` / `:calls:args` add no rows.

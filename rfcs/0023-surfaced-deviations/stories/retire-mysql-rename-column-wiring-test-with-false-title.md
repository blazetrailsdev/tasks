---
title: "Retire the renameColumn wiring test whose title asserts a cache clear that no longer exists"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: deletes a trails-only wiring describe that parity:test does not match; the underlying body was already converged in #6171."
---

## Context

Surfaced in PR #6171 (`adapter-ddl-bodies-clear-schema-cache-rails-never-touches`).

`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.test.ts`
~318 has a test titled:

> "clears the cache before issuing the ALTER TABLE RENAME COLUMN then fixes indexes"

That name is now false. PR #6171 deleted the `schemaCache.clearDataSourceCacheBang`
call from `AbstractMysqlAdapter#renameColumn` because Rails'
`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:440-443`
has no such call:

```ruby
def rename_column(table_name, column_name, new_column_name) # :nodoc:
  execute("ALTER TABLE #{quote_table_name(table_name)} #{rename_column_for_alter(table_name, column_name, new_column_name)}")
  rename_column_indexes(table_name, column_name, new_column_name)
end
```

The test body now asserts the ALTER and the `renameColumnIndexes` fixup and
explicitly asserts the clear is **absent** (the `"clear:users"` event is gone
from the expected array). The title says the opposite.

The name was left verbatim on purpose: CLAUDE.md's "NEVER rename or reword test
names" rule is unconditional, and review of #6171 confirmed that reading, so the
PR added a comment above the `it` recording the discrepancy rather than
renaming. That is the correct call under the rule but leaves a permanently
misleading title in the tree.

## Converged shape

Delete the `AbstractMysqlAdapter#renameColumn wiring` describe. It is a
trails-only wiring test with no Rails counterpart — it is not matched by
`parity:test`, so deleting it loses no parity credit — and it exists to pin a
call that no longer exists. The two behaviours it still covers (wrapping
`renameColumnForAlter`'s fragment in `ALTER TABLE`, then calling
`renameColumnIndexes`) are the whole of a two-line Rails body already exercised
by the MySQL lane's integration coverage.

Deleting is not renaming, so this converges without touching the rule.

If the coverage is judged worth keeping standalone, the alternative is a
correctly-named replacement describe plus deletion of the old one — but confirm
that reading of the never-rename rule first, since #6171's review treated it as
unconditional.

## Acceptance criteria

- [ ] No test in the tree asserts the absence of a call while its title claims
      the call happens.
- [ ] No test name is reworded in place.
- [ ] `pnpm parity:test` delta is non-negative.
- [ ] MySQL lane green.

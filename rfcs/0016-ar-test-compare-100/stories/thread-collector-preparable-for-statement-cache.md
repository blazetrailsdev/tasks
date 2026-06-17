---
title: "thread-collector-preparable-for-statement-cache"
status: ready
updated: 2026-06-17
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`statement cache with sql string literal` in
`packages/activerecord/src/bind-parameter.test.ts` mirrors Rails
`bind_parameter_test.rb:100-107` `test_statement_cache_with_sql_string_literal`,
which asserts the query **IS** cached (`assert_includes statement_cache,
to_sql_key(topics.arel)`):

```ruby
topics = Topic.where("topics.id = ?", 1)
assert_equal [1], topics.map(&:id)
assert_includes statement_cache, to_sql_key(topics.arel)
```

PR #3537 wired prepared-statement pool population by inferring preparability from
**bind presence** in `DatabaseStatements.selectAll`
(`connection-adapters/abstract/database-statements.ts`): a SELECT is pooled when
`preparedStatements && binds.length > 0`. This matches Rails for 5 of the 6
`statement cache*` cases, but it cannot distinguish the two **no-bind** inlined
shapes that Rails treats oppositely via `collector.preparable`:

- `where(id: [1, 3])` — IN-clause array → Rails `collector.preparable = false`
  → NOT cached (`assert_not_includes`). trails inlines, binds `[]` → not pooled. ✓
- `where("topics.id = ?", 1)` — SQL string literal: Rails `sanitize_sql` bakes
  the value into an `Arel::Nodes::SqlLiteral`, leaving `preparable = true`
  (no unpreparable node) → CACHED (`assert_includes`). trails inlines, binds
  `[]` → not pooled. ✗ (inverted vs Rails)

Because both shapes carry zero binds in trails, bind-inference cannot yield
Rails' opposite results; only a first-class `preparable` flag can. So
`statement cache with sql string literal` is left `it.skip` (BLOCKED) by #3537
rather than ratifying the inverted assertion.

Rails refs: `abstract/database_statements.rb` `select_all`
(`exec_query(..., prepare: prepared_statements && preparable)`),
`to_sql_and_binds` (`preparable` from `collector.preparable`),
`bind_parameter_test.rb:100-107`.

## Acceptance criteria

- Thread the Arel collector's `preparable` flag through `to_sql_and_binds` →
  `selectAll` → `execQuery`'s `prepare`, replacing the bind-presence proxy in
  `DatabaseStatements.selectAll`, so a no-bind **preparable** SELECT (SQL string
  literal) is pooled while a no-bind **non-preparable** SELECT (IN-clause array)
  is not — matching Rails `collector.preparable`.
- Un-skip `statement cache with sql string literal` and assert it IS cached
  (`toContain`), matching Rails' `assert_includes`. Keep `statement cache with in
clause` asserting NOT cached.
- Test names unchanged. No stubs. No forcing green.

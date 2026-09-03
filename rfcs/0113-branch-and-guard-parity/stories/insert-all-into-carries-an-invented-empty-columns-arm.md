---
title: "InsertAll::Builder#into carries an empty-columns arm and a VALUES clause Rails does not write"
status: draft
updated: 2026-09-03
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
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

Rails' `InsertAll::Builder#into` is two lines
(`vendor/rails/activerecord/lib/active_record/insert_all.rb:234-236`):

```ruby
def into
  "INTO #{model.quoted_table_name} (#{columns_list})"
end
```

trails' `into` (`packages/activerecord/src/insert-all.ts`) carries an extra
leading branch Rails does not have: when `keysIncludingTimestamps()` is empty
it throws `"Bulk insert with no explicit columns is not supported"` for a
multi-row insert, emits `INTO <table> () VALUES ()` on mysql2, and
`INTO <table> DEFAULT VALUES` otherwise. It also appends the compiled
`valuesList()`, where Rails' `into` stops at the column list and
`build_insert_sql` supplies the VALUES clause.

None of that is in the Ruby. It is an invented arm (RFC 0113's shape: a branch
and a guard Rails does not write), and it makes `into` a different method from
Rails' — the surrounding SQL assembly is what should carry the empty-column
case, if anything does.

Surfaced while porting `columns_list`/`format_columns`/`quote_columns` in
PR #7432; the helpers themselves are now faithful, so `into` is the remaining
divergence in that neighbourhood.

## Converged shape

`into` returns `` `INTO ${quotedTableName} (${columnsList()})` `` and nothing
else. Whatever the empty-keys arms are actually serving moves to the caller
that builds the full statement, or is deleted if the Rails path already covers
it — check `build_insert_sql` (`insert_all.rb:214-232`) and each adapter's
override before assuming the arm is load-bearing.

## Acceptance criteria

- `into` mirrors `insert_all.rb:234-236` line for line.
- The mysql2 `() VALUES ()` / `DEFAULT VALUES` behaviour is preserved by the
  Rails-shaped path or shown to be unreachable, with the existing insert-all
  tests green on every adapter lane.

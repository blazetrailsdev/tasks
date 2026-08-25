---
title: 'MySQL change_column_null/change_column_comment pass "" where Rails passes nil, plus an invented undefined→null comment normalization'
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6195
claim: "2026-08-07T19:28:44Z"
assignee: "execute-migration-in-transaction-split-into-invented-run-migration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while widening the MySQL `change_column` family's types in PR #6182
(`pg-mysql-change-column-for-alter-widen-abstract-signatures`), which converged
the signatures but left the two bodies below alone.

`AbstractMysqlAdapter#change_column_null` and `#change_column_comment`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:381-394`)
both pass `nil` as the _type_ argument:

```ruby
def change_column_null(table_name, column_name, null, default = nil) # :nodoc:
  validate_change_column_null_argument!(null)
  unless null || default.nil?
    execute("UPDATE ... SET ...=#{quote(default)} WHERE ... IS NULL")
  end
  change_column table_name, column_name, nil, null: null
end

def change_column_comment(table_name, column_name, comment_or_changes) # :nodoc:
  comment = extract_new_comment_value(comment_or_changes)
  change_column table_name, column_name, nil, comment: comment
end
```

`nil` is what `build_change_column_definition`'s `type || column.sql_type`
(`abstract_mysql_adapter.rb:405+`) is written against: it falls back to the
column's existing SQL type. trails passes `""` at both call sites
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`,
`changeColumnNull` and `changeColumnComment`), which reaches the same fallback
only because `resolvedType = type || column.sqlType || ""` treats `""` as falsy
too. It is the right answer for the wrong reason, and a reader comparing the
two files sees an argument Rails does not pass.

Second, `changeColumnComment` carries a normalization with no Rails analogue,
labelled as such at the call site:

```ts
const comment = (extracted === undefined ? null : extracted) as string | null;
```

`extract_new_comment_value` returns nil or the value; there is no undefined arm
in Ruby. The cast is there because `extractNewCommentValue`
(`abstract/schema-statements.ts`) is typed `unknown`.

## Converged shape

Both call sites pass `null` for the type, with `buildChangeColumnDefinition`'s
parameter accepting it (`ColumnType | null`) so the `type || column.sqlType`
fallback is reached the way Ruby reaches it. `extractNewCommentValue` returns a
typed value so `changeColumnComment` can hand the extraction straight to
`changeColumn` without the undefined→null step or the cast — the shape of
`change_column_comment`'s two lines.

## Acceptance criteria

- [ ] `changeColumnNull` and `changeColumnComment` pass `null`, not `""`, as
      the type argument (`abstract_mysql_adapter.rb:388,393`).
- [ ] The `undefined → null` normalization and its `as string | null` cast are
      gone, with `extractNewCommentValue`'s return type carrying the
      information instead.
- [ ] MySQL/MariaDB lanes green, including the existing
      `AbstractMysqlAdapter#changeColumnComment (#1568)` clear-path test.

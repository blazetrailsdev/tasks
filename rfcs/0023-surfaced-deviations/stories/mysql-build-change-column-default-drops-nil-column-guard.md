---
title: "AbstractMysqlAdapter#buildChangeColumnDefaultDefinition drops Rails' nil-column guard"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# AbstractMysqlAdapter#buildChangeColumnDefaultDefinition drops Rails' nil-column guard

## Context

Surfaced while landing #7152, which deleted the invented
`if (default_ === undefined) default_ = null;` line from this method. Removing
it left the body one line short of Rails.

Rails, `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:373-379`:

```ruby
def build_change_column_default_definition(table_name, column_name, default_or_changes) # :nodoc:
  column = column_for(table_name, column_name)
  return unless column

  default = extract_new_default_value(default_or_changes)
  ChangeColumnDefaultDefinition.new(column, default)
end
```

`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:558-566`
has no counterpart to `return unless column` (rb:375). It constructs a
`ChangeColumnDefaultDefinition` with a null column instead, which pushes the
failure downstream into the schema-creation visitor (`o.column.name` on the
`SET DEFAULT` path, `mysql/schema_creation.rb:32`) rather than returning `nil`
to the caller as Rails does.

`change_column_default` (`abstract/schema_statements.rb:1844-1846`) accepts a
`nil` definition — `schema_creation.accept(nil)` is the Rails no-op for an
unknown column — so the early return is load-bearing, not defensive noise.

## Converged shape

Add the rb:375 guard and return `undefined`, widening the return type to
`Promise<ChangeColumnDefaultDefinition | undefined>`; check the callers of
`buildChangeColumnDefaultDefinition` handle the absent definition the way
rb:1844-1846 does.

## Acceptance criteria

- [ ] `buildChangeColumnDefaultDefinition` returns early when `columnFor`
      yields no column, mirroring rb:375.
- [ ] The callers handle the absent definition without raising.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.

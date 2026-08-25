---
title: "order_column fallback quotes via quote_column_name, Rails uses quote_table_name"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 6295
claim: "2026-08-09T19:39:19Z"
assignee: "order-column-fallback-quotes-column-not-table-name"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `order!`/`reorder!` onto `preprocessOrderArgs` (PR #5937),
which made `orderColumn` the live resolution path for every Symbol/Hash order arg.

Rails' `order_column` falls back to `quote_table_name`:

```ruby
def order_column(field)
  arel_column(field) do |attr_name|
    if attr_name == "count" && !group_values.empty?
      table[attr_name]
    else
      Arel.sql(model.adapter_class.quote_table_name(attr_name), retryable: true)
    end
  end
end
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2153-2161`)

trails' `orderColumn`
(`packages/activerecord/src/relation/query-methods.ts`) calls
`safeQuoteColumnName(modelClass, attrName)` instead.

On SQLite/PostgreSQL (double quotes) and MySQL/MariaDB (backticks) the two
quoters produce identical output, so this is currently unobservable — which is
why it survived. It is still the wrong Rails primitive, and it will diverge for
any adapter whose `quote_table_name` and `quote_column_name` differ (the
existing story `quote-dispatch-through-column-name-and-quoted-date` covers the
general dispatch split).

Note this is pre-existing, not introduced by #5937; that PR only increased how
much traffic flows through it.

## Acceptance criteria

- [ ] `orderColumn`'s fallback quotes via the adapter's `quoteTableName`,
      matching Rails' `order_column`.
- [ ] The `retryable: true` marking on the resulting SqlLiteral is preserved.
- [ ] Order SQL is byte-identical on sqlite3/postgresql/mysql2 for the
      qualified-symbol and hash order forms.
- [ ] No regression in the order/relations/calculations suites.

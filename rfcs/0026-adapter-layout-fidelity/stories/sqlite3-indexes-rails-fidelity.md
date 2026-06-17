---
title: "Close SQLite3 indexes() fidelity gaps vs SQLite3::SchemaStatements#indexes"
status: done
updated: 2026-06-17
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3400
claim: "2026-06-15T19:30:27Z"
assignee: "sqlite3-indexes-rails-fidelity"
blocked-by: null
---

## Context

`extract-sqlite3-schema-introspection` (PR #3234) moved the SQLite `indexes`
introspection method into the Rails-mirrored
`connection-adapters/sqlite3/schema-statements.ts` as pure code motion. Now
that it is homed in the file mirroring `SQLite3::SchemaStatements#indexes`
(`activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb`),
four pre-existing divergences from the Rails implementation are more glaring.
None were introduced by the motion PR; all predate it in the adapter's inline
version. This story closes them as behavior-changing fidelity work (will touch
tests / expectations).

Rails source for reference (`schema_statements.rb#indexes`):

```ruby
def indexes(table_name)
  query_all("PRAGMA index_list(#{quote_table_name(table_name)})").filter_map do |row|
    next if row["name"].start_with?("sqlite_")
    index_sql = query_value(<<~SQL)
      SELECT sql FROM sqlite_master WHERE name = #{quote(row['name'])} AND type = 'index'
      UNION ALL
      SELECT sql FROM sqlite_temp_master WHERE name = #{quote(row['name'])} AND type = 'index'
    SQL
    /\bON\b\s*"?(\w+?)"?\s*\((?<expressions>.+?)\)(?:\s*WHERE\b\s*(?<where>.+))?(?:\s*\/\*.*\*\/)?\z/i =~ index_sql
    columns = query_all("PRAGMA index_info(#{quote(row['name'])})").map { |col| col["name"] }
    where = where.sub(/\s*\/\*.*\*\/\z/, "") if where
    orders = {}
    if columns.any?(&:nil?)
      columns = expressions
    else
      if index_sql
        index_sql.scan(/"(\w+)" DESC/).flatten.each { |order_column| orders[order_column] = :desc }
      end
    end
    IndexDefinition.new(table_name, row["name"], row["unique"] != 0, columns, where: where, orders: orders)
  end
end
```

## Acceptance criteria

- [ ] **Filter** matches Rails: skip indexes whose name `start_with?("sqlite_")`
      rather than filtering on `origin === "c"`. This includes PK/UNIQUE-backed
      indexes (`origin` `"pk"`/`"u"`) that have user-visible names, matching
      Rails (`schema_statements.rb:12`).
- [ ] **Temp-schema index SQL** is located via
      `sqlite_master UNION ALL sqlite_temp_master` (schema-qualified form for
      attached schemas), so temp-table index `WHERE` clauses are not silently
      dropped (`schema_statements.rb:14-22`).
- [ ] **`orders`** is populated by scanning the index SQL for `"col" DESC`
      entries and returned on each index definition (`schema_statements.rb:38-43`).
- [ ] **Expression indexes**: when `index_info` yields any nil column name,
      substitute the `expressions` capture from the ON-clause regex instead of
      emitting null/garbage columns (`schema_statements.rb:33-34`).
- [ ] Result shape carries `orders` (and expression-index columns) through to
      consumers (schema dumper, `indexExists`, etc.); add/adjust tests to cover
      DESC ordering, expression indexes, temp-table indexes, and PK/UNIQUE-named
      indexes.
- [ ] Verify against Rails' SQLite index tests; test names match Rails verbatim.

## Notes

Discovered during review of PR #3234. Behavior-changing — do NOT fold into a
pure-motion PR. Single PR from main, under the 500 LOC ceiling.

---
title: "Emit Rails' inter-table and pre-foreign-key blank lines instead of table()'s trailing push"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into converge-schema-dumper-tables-single-body — both rewrite SchemaDumper#tables/table() onto Rails' single body at schema_dumper.rb:134-155, where the explicit inter-section blank lines live"
---

## Context

Surfaced while landing #6369 (`naming-burndown-ar-schema-dumper-stream`), which
renamed the dumper's accumulator to `stream` and split the foreign-key loop.
Rails separates the dumped sections with explicit blank lines that the port does
not emit; instead `table()` unconditionally pushes a trailing `""` after every
table, which happens to produce a blank line in roughly the right places.

`schema_dumper.rb:139-155`:

```ruby
not_ignored_tables.each_with_index do |table_name, index|
  table(table_name, stream)
  stream.puts if index < not_ignored_tables.count - 1
end

if @connection.supports_foreign_keys?
  foreign_keys_stream = StringIO.new
  not_ignored_tables.each do |tbl|
    foreign_keys(tbl, foreign_keys_stream)
  end

  foreign_keys_string = foreign_keys_stream.string
  stream.puts if foreign_keys_string.length > 0

  stream.print foreign_keys_string
end
```

trails (`packages/activerecord/src/schema-dumper.ts`, `tables`/`table`):

- the inter-table separator is a trailing `stream.push("")` at the end of
  `table()` (so the LAST table also gets one, where Rails emits none);
- the `stream.puts if foreign_keys_string.length > 0` guard before the FK block
  is absent entirely — the FK lines are appended straight after the last table's
  trailing blank.

The two deviations currently cancel out for the common case, which is why the
dump looks right; they diverge for a single-table dump and for a dump whose FK
stream is empty.

## Acceptance criteria

1. `table()` no longer pushes a trailing `""`; `tables()` emits the separator
   between tables per `schema_dumper.rb:141`, and the
   `foreign_keys_string.length > 0` guard per `:150`.
2. `pg`/`mysql` `table()` overrides, which currently pop and re-push that
   trailing `""` (`postgresql/schema-dumper.ts`), are adjusted with it.
3. Dumped output is unchanged for the multi-table canonical schema, and gains
   the Rails-correct shape for the single-table and empty-FK cases.
4. `schema-dumper.test.ts`, `adapters/sqlite3/virtual-table.test.ts` and
   `connection-adapters/mysql/schema-dumper.test.ts` stay green.

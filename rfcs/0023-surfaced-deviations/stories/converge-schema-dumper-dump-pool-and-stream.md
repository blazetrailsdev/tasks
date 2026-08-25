---
title: "SchemaDumper.dump takes the migration pool and a stream, and dump_schema takes format"
status: done
updated: 2026-08-13
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6489
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left unconverged by `call-args-ar-kwargs-vs-positional` (PR #6360): the
`tasks/database-tasks.ts` `dump_schema` → `dump` row (and its sibling
`dump_schema` → `schema_dump_path` row) are downstream of a signature
difference, not an argument list.

Rails `DatabaseTasks.dump_schema`
(`activerecord/lib/active_record/tasks/database_tasks.rb:431-451`):

```ruby
def dump_schema(db_config, format = ActiveRecord.schema_format)
  return unless db_config.schema_dump
  filename = schema_dump_path(db_config, format)
  return unless filename
  FileUtils.mkdir_p(db_dir)
  case format
  when :ruby
    File.open(filename, "w:utf-8") do |file|
      ActiveRecord::SchemaDumper.dump(migration_connection_pool, file)
    end
```

Two divergences:

- `SchemaDumper.dump` takes a **pool** and an open **file handle** and writes to
  it. trails' `SchemaDumper.dump(adapter, { language })` takes an adapter and
  _returns_ a source string that `dumpSchema` then `writeFileSync`s.
- `dump_schema` takes `format` as a second positional and threads it into
  `schema_dump_path(db_config, format)`; trails' `dumpSchema(dbConfig)` takes
  only the config and reads `this.schemaFormat` internally. (`loadSchema` in the
  same file already takes `format` positionally, so the pair is inconsistent.)

The `{ language }` kwarg is a genuine trails concern — the dumper emits TS or
JS, where Rails emits Ruby — but it does not require the return-a-string shape.

## Converged shape

`SchemaDumper.dump(pool, stream)` writing to the stream, with the TS/JS language
selection resolved from configuration inside the dumper rather than passed at
the call. `dump_schema(db_config, format = DatabaseTasks.schemaFormat)` taking
`format` positionally and passing it to `schema_dump_path`.

## Acceptance criteria

1. `SchemaDumper.dump` takes the migration connection pool and a writable
   stream, cited to `tasks/database_tasks.rb:442` and
   `activerecord/lib/active_record/schema_dumper.rb`.
2. `dump_schema` accepts `format` positionally and passes it to
   `schema_dump_path` (`database_tasks.rb:435`).
3. Every `SchemaDumper.dump` caller is updated; no wrapper that re-creates the
   return-a-string shape is left behind.
4. Both `tasks/database-tasks.ts` `dump_schema` rows are deleted from the
   baseline by hand; `pnpm parity:api:calls:args` stays green.

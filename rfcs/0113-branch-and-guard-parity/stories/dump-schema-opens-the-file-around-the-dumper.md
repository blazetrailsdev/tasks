---
title: "dump_schema opens the file BEFORE dumping into it, the way Rails' File.open block does"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 46
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Tasks::DatabaseTasks.dump_schema`
(`activerecord/lib/active_record/tasks/database_tasks.rb:431-452`) runs the
dumper INSIDE the `File.open` block, so the dumper writes to the open stream:

```ruby
FileUtils.mkdir_p(db_dir)
case format
when :ruby
  File.open(filename, "w:utf-8") do |file|
    ActiveRecord::SchemaDumper.dump(migration_connection_pool, file)
  end
```

`packages/activerecord/src/tasks/database-tasks.ts:622-629` cannot: trails'
`SchemaDumper.dump` is `async` (`packages/activerecord/src/schema-dumper.ts:352`)
and takes a `string[]` accumulator rather than an IO, while `File.open`'s block
form is synchronous. So the port dumps into the array first and opens the file
afterwards:

```ts
const file: string[] = [];
await SchemaDumper.dump(migrationConnectionPool, file);
File.open(filename, "w", (f) => f.write(file.join("\n")));
```

PR #7462 baselined the resulting `order:dump,open` row
(`activerecord/tasks/database-tasks.json`) when `File` left
`CORE_CLASS_RECEIVERS`. The `open` call itself is made; only its position
relative to `dump` diverges.

The `"w"`-vs-`"w:utf-8"` half of the same call is a separate, already-filed
concern — RFC 0129's `io-write-must-transcode-to-utf8-in-text-mode` — and this
story should land after it, since a streaming dumper writing through `IO#write`
needs the text-mode encoding to be correct first.

## Acceptance criteria

- `SchemaDumper.dump` accepts the stream Rails passes it — an object answering
  the `puts`/`print`/`<<` surface `schema_dumper.rb` actually calls — so
  `dump_schema` can open the file and dump into it in Rails' order.
- If the async boundary genuinely blocks the block form, the converged shape is
  an `await`-able `File.open` sibling that still opens BEFORE the dump, not a
  reordering; do not close this story by rewriting the baseline reason.
- The `order:dump,open` row is removed from
  `scripts/api-compare/call-mismatches-exclude/activerecord/tasks/database-tasks.json`
  (only-shrink: delete by hand, no reseed) and `pnpm parity:api:calls` is green.
- The `:sql` arm's `File.open(filename, "a")` tail
  (`database_tasks.rb:447-450`, `f.puts dump_schema_information` then
  `f.print "\n"`) converges in the same PR — it is the same method and the same
  shape.
- Schema dumps stay byte-identical for the existing fixtures; the
  `database-tasks` and `schema-file-generator` tests keep their names.

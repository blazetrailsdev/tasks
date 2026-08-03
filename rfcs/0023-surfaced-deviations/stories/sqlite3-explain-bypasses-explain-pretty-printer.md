---
title: "sqlite3 explain hand-formats rows instead of using ExplainPrettyPrinter"
status: done
updated: 2026-08-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5934
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractSQLite3Adapter#explain`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:949`)
hand-formats the plan rows:

```ts
return result
  .toArray()
  .map((r) => `${r.id}|${r.parent}|${r.notused}|${r.detail}`)
  .join("\n");
```

Rails delegates to the printer instead
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:21`):

```ruby
SQLite3::ExplainPrettyPrinter.new.pp(result)
```

Two divergences fall out:

1. The trails printer exists
   (`packages/activerecord/src/connection-adapters/sqlite3/explain-pretty-printer.ts`)
   but nothing in the adapter calls it — the adapter duplicates its job.
2. Neither matches Rails' printer
   (`vendor/rails/.../sqlite3/explain_pretty_printer.rb:13-17`), which is
   `result.rows.map { |row| row.join("|") }.join("\n") + "\n"` — a positional
   join over every column plus a **trailing newline**. Trails picks four named
   columns (`id`/`parent`/`notused`/`detail`) and emits no trailing newline, so
   the output differs whenever SQLite returns a different column set.

Surfaced while reviewing #5744, which routed sqlite3 `explain` through
`internalExecQuery` but left the formatting untouched.

## Acceptance criteria

- `AbstractSQLite3Adapter#explain` calls the SQLite3 `ExplainPrettyPrinter`
  rather than formatting inline.
- The printer's `pp` mirrors Rails: positional join of every column with `|`,
  rows joined with `\n`, trailing `\n`.
- `packages/activerecord/src/adapters/sqlite3/explain.test.ts` and
  `explain.test.ts` still pass on sqlite.

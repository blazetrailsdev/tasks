---
title: "Converge the mysql adapter interpolation hoists that reorder quoteTableName"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6457
claim: "2026-08-13T03:56:51Z"
assignee: "call-args-ar-select-async-kwarg"
blocked-by: null
closed-reason: null
---

## Context

PR #6404 made both extractors record call sequences in EVALUATION order, which
surfaced three mysql-adapter bodies that genuinely evaluate their calls in a
different order than Rails. All three hoist a value into a local that Rails
interpolates inline, moving it above the `quote_table_name` Rails evaluates
first in the same string.

Rails (`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`):

- `change_column_default` (:369) —
  `execute "ALTER TABLE #{quote_table_name(table_name)} #{change_column_default_for_alter(...)}"`
- `change_column_null` (:381) —
  `execute("UPDATE #{quote_table_name(table_name)} SET #{quote_column_name(column_name)}=#{quote(default)} WHERE #{quote_column_name(column_name)} IS NULL")`
- `rename_column` (:396) —
  `execute("ALTER TABLE #{quote_table_name(table_name)} #{rename_column_for_alter(...)}")`

trails (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`):
`changeColumnDefault` (:687), `changeColumnNull` (:758), `renameColumn` (:834)
each bind a local (`fragment`, `colId`) before the `execute` template.

`changeColumnDefault` / `renameColumn` hoist because the fragment helper is
async and `await` cannot appear where Rails interpolates it; `changeColumnNull`
hoists `quoteColumnName` purely to avoid repeating it, which Rails does repeat.

## Acceptance criteria

1. `changeColumnNull` interpolates `quoteColumnName(columnName)` twice inline,
   as Rails does, so `quoteTableName` is evaluated first.
2. `changeColumnDefault` / `renameColumn`: converge as far as the language
   allows — if the `await` hoist is unavoidable, evaluate `quoteTableName` into
   its own local FIRST so the recorded order matches Rails, rather than leaving
   the fragment above it.
3. The three `order:*,quoteTableName` rows are deleted by hand from
   `call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
   (only-shrink, no `--write` reseed).

---
title: "Converge mismatched_foreign_key_details regex and options-building to Rails"
status: done
updated: 2026-09-25
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8099
claim: "2026-09-25T18:11:42Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#mismatched_foreign_key_details` (`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:978-1000`) matches:

    /(?:CREATE|ALTER)\s+TABLE\s*(?:`?\w+`?\.)?`?(?<table>\w+)`?.+?FOREIGN\s+KEY\s*\(`?(?<foreign_key>#{foreign_key_pat})`?\)\s*REFERENCES\s*(`?(?<target_table>\w+)`?)\s*\(`?(?<primary_key>\w+)`?\)/xmi

It then builds an `options` hash with `table` / `foreign_key` / `target_table` / `primary_key` / `primary_key_column`, and returns `{}` when nothing matches.

The trails port (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`, `mismatchedForeignKeyDetails`) differs in two ways:

- **The pattern.** It requires `CREATE\s+TABLE\s+` / `ALTER\s+TABLE\s+` (whitespace, not `\s*`) and adds an `(?:IF\s+NOT\s+EXISTS\s+)?` arm that Rails does not have. So statements with no whitespace after `TABLE` match differently, and `IF NOT EXISTS` statements match where Rails fails to (Rails would capture `IF` as the table).
- **The control flow.** It early-returns `{}` and destructures `match.groups`, where Rails builds `options = {}` and fills it inside `if match`.

## Acceptance criteria

- [ ] The regex source equals Rails' (the `x` flag's whitespace stripped), with `i`/`m`/`s` flags matching Rails' `mi`.
- [ ] The body builds `options` and fills it under `if (match)`, as at `:988-997`.
- [ ] A MySQL-lane test with an `IF NOT EXISTS` statement asserts the Rails result.

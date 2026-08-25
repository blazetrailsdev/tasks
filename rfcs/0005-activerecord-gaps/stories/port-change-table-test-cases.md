---
title: "Port migration/change_table_test.rb"
status: done
updated: 2026-07-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5622
claim: "2026-07-29T23:30:03Z"
assignee: "port-change-table-test-cases"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping PR #5614 (`port-column-methods-primary-key-helper`,
RFC 0005).

`vendor/rails/activerecord/test/cases/migration/change_table_test.rb` has no
trails counterpart at all — `grep -rl ChangeTableTest packages/activerecord/src`
returns nothing. It is the file that pins the whole `change_table` proxy: every
`ColumnMethods` shorthand on `Table`, the multi-name forms, `timestamps` /
`remove_timestamps`, `index` / `rename_index`, `references` /
`remove_references`, `foreign_key`, and the `primary_key` helper #5614 just
ported.

Rails' harness is `with_change_table { |t| expect :add_column, nil, [...] }` — a
recording connection double asserting the exact `@base` call each shorthand
makes. trails' `Table` methods forward to `SchemaStatementsLike`, so the same
recorder shape ports directly (#5614 hand-rolled a one-off version of it for a
single case in `schema-definitions.trails.test.ts`).

Consequence today: the change_table half of the proxy is only covered
incidentally, by whichever migration tests happen to call a shorthand. #5614's
own coverage had to live in the trails-only companion file for lack of the
mirrored file, so `parity:test` pairs none of it.

## Acceptance criteria

- `packages/activerecord/src/migration/change-table.test.ts` mirrors
  `change_table_test.rb`, test names matching Rails exactly (they are how
  `parity:test` pairs them — do not reword).
- The recording-connection helper mirrors Rails' `with_change_table` /
  `expect` rather than each test hand-rolling a double.
- The `primary_key` case (`change_table_test.rb:118-123`) uses the Rails-literal
  `first: true`; that option needs
  `column-options-omit-mysql-first-and-after-positioning` (0023) first, so
  either sequence after it or gate that one case.
- Once the mirrored file exists, fold #5614's one-off change_table assertion in
  `schema-definitions.trails.test.ts` into it and delete the duplicate.
- `parity:test` delta for the file is positive; no bespoke tables (canonical
  schema only).

---
title: "bigint-roundtrip.test.ts is trails-only: rename to .trails.test.ts"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-convergence item: a cosmetic file rename. parity:test matches on describe/test names, and this file's describe title ('SQLite3 bigint round-trip') is not a Rails class name either way, so the rename changes no fidelity measurement and no behaviour."
---

## Context

Surfaced while converting the sqlite3 adapter sibling suites to the ambient
connection (PR #5499, RFC 0029).

`packages/activerecord/src/adapters/sqlite3/bigint-roundtrip.test.ts` has no
Rails counterpart. The full contents of
`vendor/rails/activerecord/test/cases/adapters/sqlite3/` are:

`bind_parameter_test.rb`, `collation_test.rb`, `copy_table_test.rb`,
`dbconsole_test.rb`, `explain_test.rb`, `json_test.rb`, `quoting_test.rb`,
`sqlite3_adapter_prevent_writes_test.rb`, `sqlite3_adapter_test.rb`,
`sqlite3_create_folder_test.rb`, `sqlite_rake_test.rb`, `statement_pool_test.rb`,
`transaction_test.rb`, `virtual_column_test.rb`, `virtual_table_test.rb`.

There is no `bigint_roundtrip_test.rb`. Its describe title
(`"SQLite3 bigint round-trip"`) is not a Rails class name either, and its five
cases cover the `safeIntegers` driver behaviour — genuinely trails-only
coverage, worth keeping.

Per the repo convention, TS-only extras belong in a `*.trails.test.ts` file, the
way `virtual-column.trails.test.ts` and `statement-pool.trails.test.ts` in the
same directory already do. Sitting under a bare `.test.ts` name makes it look
like an unmatched Rails port to anyone reading the directory or the
`parity:test` output.

## Acceptance criteria

- [ ] Rename to `bigint-roundtrip.trails.test.ts` (`git mv`, no content change).
- [ ] Confirm `parity:test` no longer counts the file as an unmatched port, and
      that no manifest/exclude list referenced the old path.
- [ ] Test names unchanged.

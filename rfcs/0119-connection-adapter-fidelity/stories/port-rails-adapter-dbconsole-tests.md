---
title: "port-rails-adapter-dbconsole-tests"
status: claimed
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 120
pr: null
claim: "2026-09-11T00:01:04Z"
assignee: "mysql-quote-retirement-needs-hand-written-double-quoted-sql-converged"
blocked-by: null
closed-reason: null
---

## Context

`find-cmd-and-exec-walks-the-path-like-rails` (PR #7617) converged
`AbstractAdapter.find_cmd_and_exec` onto `abstract_adapter.rb:91-115` but did
not port the coverage its AC names: Rails' three adapter dbconsole test files,

- `vendor/rails/activerecord/test/cases/adapters/sqlite3/dbconsole_test.rb`
- `vendor/rails/activerecord/test/cases/adapters/postgresql/dbconsole_test.rb`
- `vendor/rails/activerecord/test/cases/adapters/mysql2/dbconsole_test.rb`

Those tests do not exercise the `$PATH` walk at all — each stubs
`find_cmd_and_exec` wholesale
(`sqlite3/dbconsole_test.rb:76-78`'s `assert_called_with(SQLite3Adapter,
:find_cmd_and_exec, args)`) and asserts on the argv the adapter would have
handed it. trails covers that argv today in
`packages/activerecord/src/connection-adapters/dbconsole-option-keys.trails.test.ts`,
a bespoke trails file whose test names are prose, and the walk itself in
`find-cmd-and-exec.trails.test.ts`. So the assertions exist but under names
`parity:test` cannot credit.

## Acceptance criteria

- [ ] The three `dbconsole_test.rb` files are ported at their mirrored paths
      with their Rails test names verbatim, stubbing `findCmdAndExec` the way
      `assert_find_cmd_and_exec_called_with` does.
- [ ] The overlapping cases in `dbconsole-option-keys.trails.test.ts` are
      deleted rather than duplicated; anything with no Rails counterpart stays
      in the `.trails.test.ts`.
- [ ] The new files are enrolled in `parity:test` (see the enrollment
      registrations in `scripts/test-compare/`).

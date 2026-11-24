---
title: "mysql2-lastidtest-table-races-across-parallel-spec-files"
status: ready
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# mysql2 lastIdTest table races across parallel spec files

## Context

`packages/mysql2/test/client.test.ts:300-310` and `packages/mysql2/test/statement.test.ts:276-280`
each `CREATE TABLE IF NOT EXISTS lastIdTest` in a before hook and `DROP TABLE lastIdTest` in an after
hook, against the one shared `activerecord_unittest` database. When the two files run concurrently,
one file's DROP removes the table under the other, which then fails with
`Mysql2::Error: Table 'activerecord_unittest.lastIdTest' doesn't exist` (errno 1146). Seen on
trails#10566, job "Active Record MariaDB Tests (3)",
<https://github.com/blazetrailsdev/trails/actions/runs/45035907747/job/137249705183>:

- `Mysql2::Client > write operations api > #last_id should return a Fixnum, the from the last INSERT/UPDATE`
- `Mysql2::Statement > affected_rows > should return number of rows affected by an insert`

Upstream mysql2 specs (`vendor/mysql2/*/spec/mysql2/client_spec.rb`, `statement_spec.rb`) use the
same table name, but RSpec runs them serially. trails#10557 already fixed the same race for
`mysql2_test`, by reseeding it atomically.

## Acceptance criteria

- [ ] The two spec files no longer share a table that one of them can drop while the other is
      using it (follow the trails#10557 approach, or serialize these files), keeping the Rails/gem
      test names verbatim.
- [ ] `pnpm vitest run packages/mysql2` passes repeatedly against MariaDB with both files running
      in parallel.

---
title: "statement-pool.test.ts claims a mysql2/statement_pool_test.rb that does not exist in Rails"
status: done
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5506
claim: "2026-07-28T13:51:43Z"
assignee: "statement-pool-test-false-rails-anchor"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/abstract-mysql-adapter/statement-pool.test.ts:1-3`
opens with:

```text
/**
 * Mirrors Rails activerecord/test/cases/adapters/mysql2/statement_pool_test.rb
 */
```

That Rails file does not exist. Only two `statement_pool_test.rb` files are
vendored:

- `vendor/rails/activerecord/test/cases/adapters/postgresql/statement_pool_test.rb`
- `vendor/rails/activerecord/test/cases/adapters/sqlite3/statement_pool_test.rb`

There is no mysql2 counterpart, so the header is a false anchor: it points
`pnpm rails:find` / `parity:test` at a path that cannot resolve, and it implies
the suite's test names are Rails-verbatim (and therefore frozen) when in fact
every `it(...)` in the file is trails-invented prose
(`"statementLimit config resizes the active pool"`,
`"executeMutation caches the plan for INSERT (reuses on repeat)"`, …).

Surfaced while converting the file to `leaseMysqlAdapter()` in #5328
(`mysql-tests-self-built-adapter-burndown-batch-3`). #5328 deliberately did not
touch it — renaming a test file is out of that story's scope and the
NEVER-rename-test-names rule made the right move unclear without triage.

Two candidate resolutions, to be decided as part of this story:

1. Rename the file to `statement-pool.trails.test.ts` and drop the `Mirrors`
   header, matching the convention used by the other trails-only adapter
   suites in the same directory (`nested-deadlock.trails.test.ts`,
   `savepoint-reconnect.trails.test.ts`). This is the shape the file's content
   already has.
2. Keep the name and re-anchor the header to whatever Rails coverage the
   assertions actually correspond to (`Mysql2StatementPool` lives in
   `vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/…`),
   if a real counterpart is found.

Option 1 looks right, but confirm against `parity:test` output before/after —
the file currently contributes to the ported-test tally under a Rails path that
does not exist, so the numbers may move.

## Acceptance criteria

- [ ] `statement-pool.test.ts` no longer claims a Rails counterpart that is
      absent from `vendor/rails/`.
- [ ] Whichever option is taken, `pnpm parity:test` is run before and after and
      any change in the reported counts is explained in the PR body.
- [ ] Test _names_ are unchanged (only the file name and/or header comment move).
- [ ] The same check is applied to the sibling MySQL adapter suites: any other
      `Mirrors Rails …` header in `adapters/mysql2/` or
      `adapters/abstract-mysql-adapter/` whose path does not exist in
      `vendor/rails/` is fixed in the same PR.

---
title: "performQuery types sql as string while Rails' execute(nil) test passes null through it"
status: in-progress
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7639
claim: "2026-09-09T12:48:28Z"
assignee: "mysql2-execute-override-only-shapes-driver-rows"
blocked-by: null
closed-reason: null
---

## Context

`performQuery`'s `sql` parameter is typed `string`
(`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts`),
but `null` genuinely reaches it. Rails'
`test_raise_error_when_cannot_translate_exception`
(`vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb:491-495`)
is `@connection.send(:log, nil) { @connection.execute(nil) }` asserting
`TypeError`, and the trails port calls `adapter.execute(null as never)`
(`packages/activerecord/src/adapters/postgresql/timestamp.test.ts`'s sibling,
`adapters/postgresql/postgresql-adapter.test.ts`) — the `as never` is the tell.

PR #7604 routed `execute` through the abstract chain, which put that call on
`performQuery`'s array-row-mode branch, where the object config
`{ text: null, rowMode }` makes `pg` raise a plain
`Error: A query must have either text or a name` instead of the `TypeError`
its string-config path raises. The branch therefore reads
`rowMode && sql != null ? { text: sql, rowMode } : sql`, a guard the parameter
type says is dead. Measured both ways against a live server: reverted, that
test fails `expected Error: A query must have either text or a… to be an
instance of TypeError`; in place, the file is 67/67.

So the type is the thing that is wrong, not the guard, and the divergence is
hidden behind an `as never` at the call site.

## Converged shape

Rails' `execute(sql, name = nil, ...)` (`abstract/database_statements.rb:136`)
places no type constraint on `sql` and the `TypeError` comes from the driver.
Type the trails seam to say the same thing — the parameter and the chain down
to the driver admit the value the ported test passes — so the guard reads as
the driver-boundary check it is and the test drops its `as never`.

## Acceptance criteria

- [ ] `adapters/postgresql/postgresql-adapter.test.ts`'s
      `raise error when cannot translate exception` no longer needs
      `null as never`.
- [ ] The `sql != null` arm in `performQuery` is either type-justified or
      replaced by whatever shape makes the driver raise `TypeError` on both
      config paths.
- [ ] PG lane green.

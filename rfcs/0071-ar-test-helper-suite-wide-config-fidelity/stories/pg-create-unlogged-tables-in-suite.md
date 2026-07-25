---
title: "Create PG test tables UNLOGGED (helper.rb:14-16)"
status: claimed
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 60
pr: null
claim: "2026-07-25T20:30:50Z"
assignee: "pg-create-unlogged-tables-in-suite"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/helper.rb:14-16`:

```ruby
if defined?(ActiveRecord::ConnectionAdapters::PostgreSQLAdapter)
  ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.create_unlogged_tables = true
end
```

Rails' AR suite creates every PG table `UNLOGGED` — a test-only speed win (no
WAL writes).

trails has the flag: `connection-adapters/postgresql-adapter.ts:321`
(`static createUnloggedTables = false`), consumed at `:4777`
(`(rest.unlogged as boolean | undefined) ?? PostgreSQLAdapter.createUnloggedTables`).
No setup file sets it, so the PG lane pays full WAL cost on every canonical
table build. Found by the RFC 0064 spike (PR #5309).

Note `adapters/postgresql/create-unlogged-tables.test.ts` exists and presumably
pins the default-`false` behavior — read it first; a suite-wide flip must not
break the test that asserts the flag's own semantics.

## Acceptance criteria

- Set `PostgreSQLAdapter.createUnloggedTables = true` for the PG test lane with
  a `// Mirror Rails activerecord/test/cases/helper.rb:14-16` comment. Decide
  and justify the bootstrap point: `test-setup-ar.ts` (suite-wide, guarded on
  the active lane) vs the PG-specific setup path — the canonical template is
  built in `test-helpers/template-global-setup.ts`, which runs pre-fork, so the
  flag must be set there too for the template tables to be UNLOGGED.
- Keep `adapters/postgresql/create-unlogged-tables.test.ts` meaningful: it must
  still exercise both polarities rather than passing trivially.
- Report the PG-lane wall-clock delta in the PR body (this is a perf story; if
  there is no measurable win, say so and close rather than shipping churn).

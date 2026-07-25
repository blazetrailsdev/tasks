---
title: "Create PG test tables UNLOGGED (helper.rb:14-16)"
status: closed
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Measured: UNLOGGED is a net LOSS on the trails PG lane, not a win. Ported the flag flip (test-setup-ar.ts + template-global-setup.ts pre-fork) and verified all 322 canonical tables came back relpersistence='u'. Wall-clock, PG lane, isolated postgres:17, order-balanced runs: 5-file batch (persistence/base/migration/dirty/transactions) 52.7-55.1s LOGGED vs 68.1-69.1s UNLOGGED (+25%); single file (dirty.test.ts) 34.7s vs 41.6s (+7s), of which only ~1.9s is inside vitest's setup+test phases — the bulk is globalSetup, i.e. building the canonical template with UNLOGGED tables and CREATE DATABASE ... TEMPLATE cloning it. Rails' win doesn't transfer because trails clones a template DB per slot instead of re-running DDL, and PG 17's CREATE DATABASE plus unlogged init forks cost more than the WAL the flag saves on these small tables. Per the story's own acceptance criteria (no measurable win -> close rather than ship churn), closing with no PR."
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

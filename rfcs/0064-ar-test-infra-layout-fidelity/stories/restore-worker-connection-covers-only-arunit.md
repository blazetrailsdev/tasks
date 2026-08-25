---
title: "restoreWorkerConnection() restores only arunit; connect() establishes both worker pools"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6187
claim: "2026-08-07T18:00:51Z"
assignee: "restore-worker-connection-covers-only-arunit"
blocked-by: null
closed-reason: null
---

## Context

`restoreWorkerConnection()` (`packages/activerecord/src/support/connection.ts:444-458`)
re-establishes `arunit` only. But `connect()` — the `ARTest.connect` port at
`support/connection.ts:411-412`, mirroring
`vendor/rails/activerecord/test/support/connection.rb:32-33` — establishes BOTH
worker pools:

```ruby
ActiveRecord::Base.establish_connection :arunit
ARUnit2Model.establish_connection :arunit2
```

So a file that displaces the worker's pools gets only half of them back, and the
caller has to hand-restore the second one. PR #6180 hit exactly this: after
adding `restoreWorkerConnection()` to `support/connection.test.ts`'s teardown,
the PG and MariaDB lanes still failed the writing-pool census with
`ARUnit2Model (sqlite3:db/fixture_database_2.sqlite3)`, and the fix was an
explicit `await ARUnit2Model.establishConnection("arunit2")` at the call site
(`support/connection.test.ts`, `connect`'s `afterEach`).

Note this is invisible on the SQLite lane — the displaced signature matches the
baseline — so it only reds on PG/MariaDB.

## Converged shape

`restoreWorkerConnection()` restores both pools, so its name means what it says
and no caller has to know which halves it covers.

The `arunit2` half needs the same probe-and-reload the `arunit` half already has
(`connection.ts:441-458` probes `posts` / `defaults` and reloads only when
absent). Under `ARCONN=sqlite3_mem` the arunit2 pool IS the database, so a plain
re-establish opens a fresh empty `:memory:` one; `provisionSecondDatabase()`
(`support/setup-second-pool.ts:68-86`) is already probe-driven and is the
natural body for that arm, but it also truncates on the present path, so the
reload must be gated on the probe rather than run unconditionally — several
callers invoke `restoreWorkerConnection()` per test.

PR #6180 deliberately did NOT widen the helper: the blast radius (every caller
re-provisioning the second database) was not worth it for one displacing file.
This story is that widening, done properly.

## Acceptance criteria

- [ ] `restoreWorkerConnection()` restores the `arunit2` pool as well as `arunit`.
- [ ] The arunit2 arm probes before reloading, and does not truncate on the
      already-provisioned path.
- [ ] `support/connection.test.ts`'s explicit
      `ARUnit2Model.establishConnection("arunit2")` is removed, since the helper
      now covers it.
- [ ] Green on SQLite (file lane), `sqlite3_mem`, PG and MariaDB — the mem lane
      is the one that distinguishes a correct implementation from a plain
      re-establish.

---
title: "base-prevent-writes' inline professors rebuild has no Rails counterpart"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5732
claim: "2026-07-31T18:20:54Z"
assignee: "base-prevent-writes-professors-rebuild-has-no-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/base-prevent-writes.test.ts` opens
`"preventing writes applies to all connections in block"` with
`await rebuildCanonicalTables(ARUnit2Model.connection, ["professors"]);`.
Rails' counterpart (`vendor/rails/activerecord/test/cases/base_prevent_writes_test.rb:68-88`)
has no such line — the body starts straight at `while_preventing_writes`.
The rebuild is trails-only setup standing in for the arunit2 tables the
suite assumes exist.

That assumption is now covered elsewhere: `provisionSecondDatabase`
(`packages/activerecord/src/support/setup-second-pool.ts`) rebuilds
`ARUNIT2_TABLES` (which includes `professors`) per worker in
`test-setup-dy.ts`, and `withSecondPool()` does the same for suites that
opt in. The inline rebuild is likely redundant, and it is also the only
reason the test reaches for `ARUnit2Model.connection` (the sync accessor)
rather than `leaseConnection()`.

Surfaced while un-gating the suite on PG/MySQL (#5720).

## Acceptance criteria

- Either the inline `rebuildCanonicalTables` call is removed (the test body
  then matches Rails line-for-line), or the reason it cannot be is recorded
  at the call site.
- The test still passes on all three lanes (sqlite, postgresql, mysql2),
  including when run as the only file in a fresh worker.

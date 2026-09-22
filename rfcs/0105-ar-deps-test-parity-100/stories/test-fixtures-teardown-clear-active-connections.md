---
title: "test-fixtures-teardown-clear-active-connections"
status: draft
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
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

## Context

`TestFixtures#teardown_fixtures` ends with
`ActiveRecord::Base.connection_handler.clear_active_connections!(:all)`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:152-160`). trails'
`teardownFixtures` (`packages/activerecord/src/test-fixtures.ts`, ported in trails#7976)
omits that call and carries `@missingRailsCall clear_active_connections! — CONVERGEABLE
test-fixtures-teardown-clear-active-connections`.

Adding the call reds `FoxyFixturesTest` (`fixtures.test.ts`, a
`useTransactionalTests: false` describe) with
`Called deprecated ActiveRecord::Base.connection method`. `release_connection`
(`connection_pool.rb:388-394`) resets the lease's `sticky` to nil, and `permanent_lease?`
(`:321-323`) is `sticky.nil?`, so after the clear the next `Model.connection` read raises
under `permanent_connection_checkout = :disallowed`, as it would in Rails. The raise comes
from trails internals that read the deprecated `connection` synchronously where Rails uses
`with_connection` / `lease_connection`. For example `associations.ts:501`
(`_loadSingularViaStatementCache`) and `base.ts:2060`. There are about 95 `.connection`
reads under `packages/activerecord/src`, and not all of them are model reads.

## Acceptance criteria

- The internal readers that are reached after a `clear_active_connections!(:all)` read
  through `with_connection` / `lease_connection` as their Rails counterparts do.
- `teardownFixtures` calls `Base.connectionHandler.clearActiveConnectionsBang("all")`
  and the `@missingRailsCall` receipt is removed.
- `fixtures.test.ts` `FoxyFixturesTest` stays green.

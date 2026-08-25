---
title: "arunit database name diverges from expand_config's activerecord_unittest"
status: done
updated: 2026-07-30
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5645
claim: "2026-07-30T14:50:19Z"
assignee: "arunit-database-name-diverges-from-expand-config"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5640, which converged the `arunit2` database name onto Rails'
literal `activerecord_unittest2`. The sibling `arunit` name did not converge.

In Rails, `ARTest.expand_config` defaults `arunit` to `activerecord_unittest`
(`vendor/rails/activerecord/test/support/config.rb:28`) — the primary test
database itself. trails' `arunitDatabaseNames`
(`packages/activerecord/src/support/arunit2-config.ts`) instead returns
`<primary>_arunit`, a throwaway database that is _not_ the primary.

The reason is recorded at the definition: the only consumer is the MySQL
cross-database-select probe (`ARUNIT_DATABASE` / `ARUNIT2_DATABASE` in
`packages/activerecord/src/adapters/abstract-mysql-adapter/test-helper.ts`,
used by `adapter.test.ts` "not specifying database name for cross database
selects"). That test does `DROP DATABASE IF EXISTS` / `CREATE DATABASE` on both
names it uses — which Rails can afford because its `arunit` is not shared with
parallel workers, and trails cannot, because dropping the worker's primary
would destroy the canonical schema mid-run.

Note the asymmetry the merge left behind: `arunit2` IS the worker's real second
database (the probe drops it and calls `provisionSecondDatabase()` to restore
it), while `arunit` is a throwaway. A convergence could apply the same
drop-and-restore treatment to the primary, or scope the probe's databases some
other way.

## Acceptance criteria

Decide and record one of:

- a spelling where `arunit` is the primary database as in Rails, with the
  cross-database-select probe made safe against the drop/recreate (e.g. restore
  the canonical schema afterwards, the way the probe already restores arunit2);
  or
- keep `<primary>_arunit` permanently, with the drop-destroys-the-worker note
  as the record.

Either way the outcome is written down rather than re-derived.

---
title: "Converge the cold-path ConnectionNotEstablished raise in Base.connection / Migration#connection onto the awaited lease"
status: ready
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8007 retired `ConnectionPool#leaseConnectionSync` and settled RFC 0152 Open question 1
per API:

- `DatabaseTasks.migrationConnection` converged. Its body is now `migration_class.lease_connection`
  (`activerecord/lib/active_record/tasks/database_tasks.rb:533-535`) and it returns the awaited
  lease. `Migrator`'s private `connection` (`migration.rb:1489-1491`) awaits it.
- `ConnectionHandling#connection` (`packages/activerecord/src/connection-handling.ts`,
  `connection_handling.rb:274-290`) and `Migration#connection` (`packages/activerecord/src/migration.ts`,
  `migration.rb:1036-1038`, `@connection || migration_connection`) did NOT converge. Each answers
  only a connection already on the lease, calls `pool.leaseConnection()` /
  `migrationConnection()` to make that lease sticky, and raises `ConnectionNotEstablished` when
  nothing is threaded. Rails has no such raise: `pool.lease_connection`
  (`connection_pool.rb:315-319`) checks one out.

The blocker was size, not language. On `aff3abc602` there were ~369 non-awaited `X.connection`
reads under `packages/*/src` (almost all AR tests) plus 19 `this.connection` reads inside
`migration.ts`. The AR suite never reaches the cold arm, because `cases/helper.ts` sets
`permanent_connection_checkout = :disallowed`, which raises first.

Knock-on deviation: `Migrator#isUseAdvisoryLock` (`use_advisory_lock?`, `migration.rb`) returns
`Promise<boolean>` because its connection is now awaited.

## Acceptance criteria

- `ConnectionHandling#connection` and `Migration#connection` reach `lease_connection` /
  `migration_connection` on the cold path with no `ConnectionNotEstablished` raise that Rails
  lacks. The likely shape is returning the awaited lease (`Promise<AbstractAdapter>`) under the
  Rails names, with callers awaiting. Split by package or directory if one PR cannot hold it.
- The two raise sites and their duplicated message string are deleted.
- The trails-only tests `connection without a threaded lease` (`connection-handling.trails.test.ts`)
  and `migration.connection raises ConnectionNotEstablished when no connection is leased`
  (`migration.trails.test.ts`) are rewritten to assert Rails' checkout. The
  `#connection emits a deprecation warning … :deprecated` test in `connection-handling.test.ts`
  returns to Rails' shape (`connection_handling_test.rb:109-135`): a cold `ActiveRecord::Base.connection`
  read with no `with_connection` wrapper.

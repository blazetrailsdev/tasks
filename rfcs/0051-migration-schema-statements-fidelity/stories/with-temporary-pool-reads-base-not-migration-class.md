---
title: "withTemporaryPool reads Base where Rails reads migration_class, and invents a removeConnection teardown arm"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6182
claim: "2026-08-07T17:05:48Z"
assignee: "activemodel-time-readers-take-rational-sec-fraction-value"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while threading Rails' `clobber:` kwarg through the temporary-pool
family (PR #6169, `with-temporary-pool-family-drops-the-clobber-kwarg`). That
story converged the kwarg and moved the two establish calls onto the connection
handler, which put the rest of the body under the light — two divergences that
were out of that story's scope remain.

Rails' `DatabaseTasks.with_temporary_pool`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:541-547`)
is five lines:

```ruby
def with_temporary_pool(db_config, clobber: false)
  original_db_config = migration_class.connection_db_config
  pool = migration_class.connection_handler.establish_connection(db_config, clobber: clobber)

  yield pool
ensure
  migration_class.connection_handler.establish_connection(original_db_config, clobber: clobber)
end
```

trails' body (`packages/activerecord/src/tasks/database-tasks.ts`,
`withTemporaryPool`) diverges in two ways:

1. **`Base` where Rails reads `migration_class`.** Every reference — the prior
   config read, both handler calls, the teardown — goes through
   `Base` (imported dynamically as `const { Base } = await import("../base.js")`)
   rather than `migration_class` (`database_tasks.rb:534-538`, which is
   `ActiveRecord::Base` by default but is a configuration point). trails already
   has `DatabaseTasks.migrationClass()` and uses it in
   `withTemporaryPoolForEach` two methods below, so the seam exists; it is
   async, which is presumably why this body reached for `Base` instead.

2. **An invented `removeConnection` arm.** Rails' `ensure` unconditionally
   re-establishes `original_db_config` (`:547`). trails branches:
   `priorConfig !== null` re-establishes, and the `else` calls
   `Base.removeConnection()` inside a bare `try/catch {}`. That arm exists to
   handle `Base.connectionDbConfig()` having thrown `ConnectionNotDefined` when
   the body started — a case Ruby does not have to model because
   `connection_db_config` on an unconnected `migration_class` raises there too,
   and Rails simply lets it propagate rather than swallowing it.

## Converged shape

Read `migrationClass()` once at the top and use it for all four references, and
delete the `priorConfig === null` / `removeConnection()` arm so the `ensure`
unconditionally re-establishes as Rails does. If the `ConnectionNotDefined`
guard turns out to be load-bearing for a real caller (`db:create` / `db:drop`
run against a not-yet-connected `Base`), converge to Rails' behaviour and let
the error propagate rather than keeping the silent-catch arm — a swallowed
`catch {}` is the shape to remove either way.

Note the one deviation in this body that is NOT in scope and should stay: the
`await pool.adapterReady` after the establish call. trails' handler resolves the
adapter class through a dynamic `import()` when given no `adapterFactory`
(`connection-adapters/abstract/connection-handler.ts:181-186`), and ESM has no
synchronous import, so the pool is not leasable until it settles. That is a
genuine language shortcoming, already justified at the call site.

## Acceptance criteria

- [ ] `withTemporaryPool` reads `migrationClass()` for the prior config and both
      `establishConnection` calls, matching `database_tasks.rb:542-547`.
- [ ] The `ensure` path re-establishes the original config unconditionally; the
      `removeConnection()` arm and its empty `catch {}` are gone.
- [ ] `db:create` / `db:drop` / `withTemporaryPoolForEach` callers stay green on
      all three adapter lanes (this body backs the whole tasks layer).

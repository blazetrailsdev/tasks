---
title: "DatabaseTasks.withTemporaryPool family drops Rails' clobber: kwarg (database_tasks.rb:512-527)"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6169
claim: "2026-08-07T12:28:33Z"
assignee: "abstract-ddl-bodies-clear-schema-cache-rails-never-touches"
blocked-by: null
closed-reason: null
---

## Context

Rails threads a `clobber:` kwarg through the whole temporary-pool family
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb`):

```ruby
def with_temporary_pool_for_each(env: ..., name: nil, clobber: false, &block)  # :512
  if name
    db_config = ...
    with_temporary_pool(db_config, clobber: clobber, &block)                    # :515
  else
    ...each { |db_config| with_temporary_pool(db_config, clobber: clobber, &block) }  # :518
  end
end

def with_temporary_connection(db_config, clobber: false, &block)                # :523
  with_temporary_pool(db_config, clobber: clobber) { |pool| pool.with_connection(&block) }
end
```

`clobber` reaches `establish_connection(..., clobber: clobber)`, which decides
whether an existing pool for the same config is _replaced_ or _reused_
(`connection_adapters/abstract/connection_handler.rb`).

trails' `DatabaseTasks.withTemporaryPool`
(`packages/activerecord/src/tasks/database-tasks.ts:1182`) has no `clobber`
parameter at all — it goes through `Base.establishConnection(config)` and
relies on the handler recognising the same `DatabaseConfig` _object_ to reuse a
pool (see the comment there about `:memory:` databases). So neither
`withTemporaryPoolForEach` (converged onto the Rails signature in PR #6162, minus
this kwarg) nor `withTemporaryConnection` can thread it, and the omission is
noted in `withTemporaryPoolForEach`'s JSDoc.

Note trails' `ConnectionHandler.establishConnection` _does_ already take
`clobber` (`connection-adapters/abstract/connection-handler.ts:130`), so the
gap is only in the `DatabaseTasks` layer above it.

## Converged shape

Add `clobber = false` to `withTemporaryPool` and thread it to the
`establishConnection` call, then thread it from `withTemporaryPoolForEach` and
`withTemporaryConnection` per `database_tasks.rb:512-527`. Keep the existing
config-object identity behaviour as the `clobber: false` path — that is what it
already models.

## Acceptance criteria

- `withTemporaryPool`, `withTemporaryPoolForEach` and `withTemporaryConnection`
  all take Rails' `clobber` kwarg with Rails' `false` default and pass it down.
- The "Rails' `clobber:` kwarg has no counterpart" note in
  `withTemporaryPoolForEach`'s JSDoc is deleted.
- A test covers `clobber: true` actually replacing a pool established for the
  same config, so the parameter is not decorative.

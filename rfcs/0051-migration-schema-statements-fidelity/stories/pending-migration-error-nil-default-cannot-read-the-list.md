---
title: "PendingMigrationError#initialize drops the nil pending_migrations: branch (migration.rb:160-162)"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6169
claim: "2026-08-07T12:28:33Z"
assignee: "abstract-ddl-bodies-clear-schema-cache-rails-never-touches"
blocked-by: null
closed-reason: null
---

## Context

`PendingMigrationError#initialize`
(`vendor/rails/activerecord/lib/active_record/migration.rb:159-165`):

```ruby
def initialize(message = nil, pending_migrations: nil)
  if pending_migrations.nil?
    pending_migrations = connection_pool.migration_context.open.pending_migrations
  end

  super(message || detailed_migration_message(pending_migrations))
end
```

PR #6162 ported the kwarg and the `detailed_migration_message` default, but not
the **nil branch** (`:161`): reading the pending list is asynchronous in trails
(`MigrationContext#open().pendingMigrations()` returns a Promise) and a JS
constructor cannot await. Today a bare `new PendingMigrationError()` falls back
to a plain static string instead of the detailed list.

Every trails caller currently passes `pendingMigrations`, so the gap is not
observable yet — but it means the error cannot be raised the way Rails raises
it from arbitrary sites, and the fallback string is invented text with no Rails
counterpart.

Note this is the same async-in-a-constructor shape as
[[migration-context-collaborators-need-a-pool]] (blocked) and shares its root
cause: reaching a pool's schema state synchronously.

## Converged shape

Two candidate routes, pick at implementation time:

1. Keep the constructor synchronous and give the class a Rails-invisible async
   factory only if one is genuinely needed — but prefer (2), since adding a
   factory is extra surface Rails does not have.
2. Have the raise sites that today would rely on the nil default resolve the
   list themselves before constructing, which is what
   `check_pending_migrations` and `check_all_pending!` already do
   (`migration.rb:722,743`) — then the nil branch is reachable only from
   user code, and the honest port is to document that one arm.

Either way the invented fallback string
(`"Migrations are pending. Run \`migrate\` to resolve."`) should go: Rails has
no such message.

## Acceptance criteria

- `new PendingMigrationError()` with no arguments no longer produces an
  invented message string with no Rails counterpart.
- The prose note in the constructor's JSDoc is deleted or reduced to the one
  arm that genuinely cannot converge.
- `detailedMigrationMessage` stays the only message builder, per
  `migration.rb:168-176`.

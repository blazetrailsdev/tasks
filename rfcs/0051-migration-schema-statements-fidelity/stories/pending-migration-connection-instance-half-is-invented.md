---
title: "PendingMigrationConnection's constructor / withAdapter have no Rails counterpart; delete with CheckPending's pendingConnection arm"
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

Rails' `PendingMigrationConnection`
(`vendor/rails/activerecord/lib/active_record/migration/pending_migration_connection.rb`)
is 15 lines and has **no instance state at all** — three class methods:

```ruby
class PendingMigrationConnection # :nodoc:
  def self.with_temporary_pool(db_config, &block)
    pool = ActiveRecord::Base.connection_handler.establish_connection(db_config, owner_name: self)
    yield pool
  ensure
    ActiveRecord::Base.connection_handler.remove_connection_pool(self.name)
  end

  def self.primary_class?  = false
  def self.current_preventing_writes = false
end
```

PR #6162 converged `with_temporary_pool` onto exactly that. What it did **not**
touch is the invented instance half of trails'
`packages/activerecord/src/migration/pending-migration-connection.ts`, which
has no Rails counterpart at all:

- a constructor taking `{ connectionName, adapter, connectionHandler }`
- `get connectionName()`
- `async withAdapter(callback)` — a bespoke "use this adapter, or check out of
  the named pool, or throw a bespoke error" dispatcher

Its only consumer is `CheckPending`'s `pendingConnection` option
(`packages/activerecord/src/migration.ts`, the `_pendingConnection` arm of
`CheckPending#call`), which is itself the invented shape that
[[check-pending-has-no-file-update-checker-watcher]] exists to converge. Rails'
`CheckPending` never touches `PendingMigrationConnection` — it calls
`ActiveRecord::Migration.check_pending_migrations` (`migration.rb:660`), which
as of #6162 is real and reaches `PendingMigrationConnection.with_temporary_pool`
itself (`migration.rb:757-769`).

So this is dead weight the moment `CheckPending` converges — but it is worth its
own row because it is measured extra surface today, and because a reader of the
file cannot tell which half is the port.

## Converged shape

Delete the constructor, `connectionName`, `withAdapter`, and the
`DatabaseAdapter` / `ConnectionHandler` imports they need. What is left is
Rails' three class methods and nothing else.

Ordering: this depends on
[[check-pending-has-no-file-update-checker-watcher]] landing first (it owns the
only caller), or the two ship together.

## Acceptance criteria

- `pending-migration-connection.ts` contains only `withTemporaryPool`,
  `isPrimaryClass`, and `currentPreventingWrites` — no instance members.
- `CheckPending` no longer accepts a `pendingConnection` option.
- `pnpm parity:api:extra --package activerecord` delta is negative (this removes
  invented surface, it does not add any).

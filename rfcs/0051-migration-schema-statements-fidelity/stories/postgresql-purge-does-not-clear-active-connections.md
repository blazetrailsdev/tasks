---
title: "PostgreSQLDatabaseTasks#purge drops Rails' clear_active_connections!(:all)"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6278
claim: "2026-08-09T13:15:56Z"
assignee: "port-remaining-mysql2-rake-tests"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Tasks::PostgreSQLDatabaseTasks#purge`
(`activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:40-44`) is:

```ruby
def purge
  ActiveRecord::Base.connection_handler.clear_active_connections!(:all)
  drop
  create true
end
```

trails' `packages/activerecord/src/tasks/postgresql-database-tasks.ts:69-72` drops
the first line entirely:

```ts
async purge(): Promise<void> {
  await this.drop();
  await this.create(true);
}
```

Without the clear, a connection leased before the purge survives across the
`DROP DATABASE` / `CREATE DATABASE` pair and points at a database that no longer
exists — which is precisely what Rails' first line prevents.

Surfaced while enrolling `postgresql_rake_test.rb` in `parity:test` (PR #6269).
`PostgreSQLPurgeTest#test_clears_active_connections`
(`activerecord/test/cases/adapters/postgresql/postgresql_rake_test.rb:208-216`)
asserts exactly this call and is therefore parked as `it.skip` in
`packages/activerecord/src/adapters/postgresql/postgresql-rake.test.ts`, with the
divergence named in the skip comment.

## Converged shape

```ts
async purge(): Promise<void> {
  await Base.connectionHandler.clearActiveConnections(":all");
  await this.drop();
  await this.create(true);
}
```

Check what trails spells the handler method — `clear_active_connections!` takes
the `:all` role argument (`connection_handling.rb`), and per CLAUDE.md a Ruby
Symbol value is the colon-prefixed string `":all"`. If trails' handler has no
such reader yet, that gap is part of this story.

## Acceptance criteria

- [ ] `PostgreSQLDatabaseTasks#purge` calls the handler's
      `clear_active_connections!(:all)` analogue as its FIRST statement, matching
      `postgresql_database_tasks.rb:40-44` line for line.
- [ ] `PostgreSQLPurgeTest#clears active connections` in
      `packages/activerecord/src/adapters/postgresql/postgresql-rake.test.ts`
      becomes a real test at its Rails name; the skip comment naming the
      divergence is removed.
- [ ] `pnpm parity:test` gate-mismatch stays 0; `pnpm parity:api:calls` does not gain
      a baseline row for the newly-made call.
- [ ] Green on the PG lane.

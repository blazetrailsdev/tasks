---
title: "Converge migrate_all: pass the version positionally, not as a targetVersion option"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6358
claim: "2026-08-11T13:36:12Z"
assignee: "naming-burndown-arel-to-sql"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6351 (RFC 0099): replacing the call-argument comparator's
source-order pairing exposed a genuine port divergence that a wrong pairing had
been hiding. Baselined at
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/database-tasks.json`
(`migrate_all` / `migrate` / `["ref:version", "kwargs{skipInitialize=bool:true}"]`)
so the ratchet stays green; the row exists to be deleted by this story.

Rails, `activerecord/lib/active_record/tasks/database_tasks.rb:243-260`:

```ruby
def migrate_all
  ...
  if db_configs.size == 1 && db_configs.first.primary?
    ActiveRecord::Tasks::DatabaseTasks.migrate(skip_initialize: true)
  else
    ...
        ActiveRecord::Tasks::DatabaseTasks.migrate(version, skip_initialize: true)
  end
end
```

and the callee at `:262`:

```ruby
def migrate(version = nil, skip_initialize: false)
```

The version is a POSITIONAL argument with a `nil` default, and `skip_initialize`
is the only kwarg. The port (`packages/activerecord/src/tasks/database-tasks.ts`,
`migrateAll`) instead passes `null` positionally and carries the version as a
`targetVersion` OPTION — `migrate(null, { skipInitialize: true, targetVersion })`.

## Converged shape

`migrate`'s TS signature takes the version positionally, defaulted, exactly as
Rails does, and `migrateAll` calls `migrate({ skipInitialize: true })` on the
single-primary arm and `migrate(version, { skipInitialize: true })` on the
mapped-versions arm. `targetVersion` disappears from the options object; check
every other `migrate` caller for the same option before removing it.

## Acceptance criteria

1. `migrate` takes the version positionally with a `null`/`undefined` default,
   matching `database_tasks.rb:262`; `targetVersion` is gone from its options.
2. Both `migrateAll` arms pass what Rails passes at `:248` and `:255`.
3. The baseline row above goes stale and is deleted by hand from
   `call-mismatches-exclude/activerecord/tasks/database-tasks.json`.
4. `pnpm parity:api:calls:args` green, row count strictly decreases.

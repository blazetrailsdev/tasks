---
title: "NullInternalMetadata carries five invented no-op members; Rails' is an empty class"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6264
claim: "2026-08-08T21:45:04Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while removing the invented `enabled` guards in PR #6256
(`internal-metadata-guards-enabled-on-methods-rails-does-not`).

Rails' `NullInternalMetadata` is an **empty class**
(`activerecord/lib/active_record/internal_metadata.rb:13-14`):

```ruby
class InternalMetadata # :nodoc:
  class NullInternalMetadata # :nodoc:
  end
```

It is a null _object_ in the identity sense only — Rails hands it out where a
pool has no metadata store (`connection_adapters/abstract/connection_pool.rb`
returns it for a `NullPool`), and callers branch on which class they got
rather than calling methods that silently no-op.

trails' `NullInternalMetadata`
(`packages/activerecord/src/internal-metadata.ts`) instead carries five
short-circuiting members with no Ruby counterpart:

```ts
async createTable(): Promise<void> {}
async dropTable(): Promise<void> {}
async get(_key: string): Promise<string | null> { return null; }
async tableExists(): Promise<boolean> { return false; }
get enabled(): boolean { return false; }
```

This is the same class of invention the `enabled`-guard story just removed from
`InternalMetadata` itself: methods that answer a comfortable lie
(`tableExists() === false` against a table that may physically exist) rather
than the truth. It also means a caller cannot tell the null object apart by
behavior — every method succeeds — so the branch Rails expects callers to make
never has to be written.

## Converged shape

Empty the class to match `internal_metadata.rb:13-14`, then fix the fallout at
whatever call sites were relying on the silent no-ops: they should branch on
the class (`instanceof NullInternalMetadata`) or hold a real `InternalMetadata`,
as Rails' callers do. Audit `DatabaseTasks` and the trailties `db` commands
first — the guard-removal story flagged those as the likely leaners, though
`MigrationContext#lastStoredEnvironment` (`migration.ts`) already guards on
`enabled` the way `migration.rb:1350` does and needs no change.

Sequencing: this reads more cleanly after
`internal-metadata-takes-a-pool-nullpool-arm-reads-enabled` (RFC 0051, ready)
settles what the NullPool arm answers.

## Acceptance criteria

- [ ] `NullInternalMetadata` declares no members
      (`internal_metadata.rb:13-14`).
- [ ] Call sites that relied on the no-op methods branch on the class instead,
      as Rails' do.
- [ ] `pnpm parity:api:extra --package activerecord` reports no novel names on
      `internal-metadata.ts` for this class.

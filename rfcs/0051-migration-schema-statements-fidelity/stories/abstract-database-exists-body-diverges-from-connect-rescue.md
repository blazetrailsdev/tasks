---
title: "abstract-database-exists-body-diverges-from-connect-rescue"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5757
claim: "2026-07-31T21:10:40Z"
assignee: "abstract-database-exists-body-diverges-from-connect-rescue"
blocked-by: null
closed-reason: null
---

## Context

Rails' `database_exists?` (`abstract_adapter.rb:362-367`) proves liveness by
attempting a connection:

```ruby
def database_exists?
  connect!
  true
rescue ActiveRecord::NoDatabaseError
  false
end
```

trails' `AbstractAdapter#databaseExists`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1970`, renamed
from `isDatabaseExists` by PR #5752) instead reads cached state:

```ts
databaseExists(): boolean {
  return this._connection !== null;
}
```

These answer different questions. Rails returns true for a reachable database
that has never been connected to; trails returns false. Rails returns false for a
dropped database; trails returns true while a stale handle is cached.

Note the sqlite3 override Rails also defines (`sqlite3_adapter.rb:135-137`:
`@config[:database] == ":memory:" || File.exist?(...)`) — check whether trails
has an instance-level equivalent, since trails' sqlite3 spelling of this has been
static.

The signature is the hard part: Rails' `connect!` has an async analogue in
trails, so a faithful port likely has to return `Promise<boolean>`, which ripples
to callers. Scope that before starting.

## Acceptance criteria

- `databaseExists` reflects reachability the way `connect!` + `rescue NoDatabaseError`
  does, not a cached handle.
- Signature change (sync → async) is either avoided with justification or
  threaded through every caller.
- Green on all three lanes.

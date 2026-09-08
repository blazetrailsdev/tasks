---
title: "validateSavepointName is an invented guard raising a trails-only Error, where Rails interpolates the name unchecked"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while deleting the per-adapter savepoint overrides (#7607, story
`savepoint-methods-duplicated-on-adapters`). With the overrides gone, every
adapter now goes through `abstract/savepoints.ts`, which makes an invented guard
the sole path for all savepoint SQL on all three adapters.

Rails interpolates the savepoint name unchecked
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/savepoints.rb:11-21`):

```ruby
def create_savepoint(name = current_savepoint_name)
  internal_execute("SAVEPOINT #{name}", "TRANSACTION")
end
```

trails first runs it through a validator
(`packages/activerecord/src/connection-adapters/abstract/savepoints.ts`):

```ts
function validateSavepointName(name: string | null): string {
  if (name == null || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid savepoint name: ${name}`);
  }
  return name;
}
```

Three divergences in one helper:

1. The guard has no Rails counterpart at all — `savepoints.rb` has no
   validation, and a caller passing a name Rails would send to the database
   gets a trails-only `Error` instead of the adapter's `StatementInvalid`.
2. The error is a bare `Error` with a trails-authored message, where any Rails
   failure here surfaces as `ActiveRecord::StatementInvalid` wrapping the
   driver's own text.
3. `name == null` is rejected, but Rails' default is
   `current_savepoint_name` — a nil there means `current_transaction`
   has no savepoint, which is a caller bug that should surface as such, not as
   a name-format complaint.

The guard was invisible while the three adapters shadowed these methods with
their own inlined SQL; #7607 removed those, so it is now load-bearing.

## Converged shape

Delete `validateSavepointName` and interpolate the name as
`savepoints.rb:11-21` does, letting a bad name fail at the database the way it
does in Rails. If a guard is genuinely wanted for SQL-injection reasons, that is
a separate, argued decision — it is not what this story closes, and it would
need a receipt naming the language shortcoming, which "Ruby has the same hole"
is not.

Check `abstract/savepoints.trails.test.ts` while you are there: any test
asserting the `Invalid savepoint name` message is asserting the invention and
goes with it.

## Acceptance criteria

- [ ] `validateSavepointName` is gone; the three `*Sql` builders interpolate
      the name directly, matching `savepoints.rb:11-21`.
- [ ] No trails-only `Error` is raised on the savepoint path.
- [ ] `pnpm parity:api:extra:gate` does not grow.
- [ ] SQLite, PostgreSQL and MariaDB lanes green, including
      `connection-adapters/abstract/savepoints.trails.test.ts`.

---
title: "AbstractAdapter.database_exists? disconnects where Rails just constructs and asks"
status: ready
updated: 2026-09-10
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' class-level `database_exists?` is one line
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:357-360`):

```ruby
def self.database_exists?(config)
  new(config).database_exists?
end
```

It constructs, asks, and drops the adapter on the floor. There is no disconnect,
because `initialize` is lazy and the instance predicate need not have opened
anything.

trails adds a `finally` that disconnects
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`):

```ts
static async databaseExists(config: unknown): Promise<boolean> {
  const ctor = this as unknown as new (config: unknown) => AbstractAdapter;
  const adapter = new ctor(config);
  try {
    return await adapter.databaseExists();
  } finally {
    await adapter.disconnectBang();
  }
}
```

`disconnectBang` on a never-connected adapter is a side effect Rails has no
counterpart for, and it runs on every call — including the SQLite3 path, whose
instance override answers from the filesystem without connecting
(`sqlite3_adapter.rb:135-137`). PR #7656 deleted SQLite3's static override so
this base one is now on the SQLite3 path too; the `finally` was left alone as
out of scope.

## Converged shape

Delete the try/finally so the body is `new(config).databaseExists()`, matching
`abstract_adapter.rb:357-360`.

Check the adapters whose instance `database_exists?` really does connect
(`abstract_adapter.rb:362-367` is `connect!` + rescue) before removing it — if a
pooled handle would leak, the fix belongs in that adapter's instance predicate,
where Rails puts it, not in a wrapper the base class does not have.

## Acceptance criteria

- [ ] `AbstractAdapter.databaseExists` is `new(config).databaseExists()` with no
      disconnect.
- [ ] No handle leak on the postgresql and mysql2 paths, whose instance
      predicate connects; verified by their existing `database_exists?` tests.

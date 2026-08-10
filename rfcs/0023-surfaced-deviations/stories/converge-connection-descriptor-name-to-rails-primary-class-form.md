---
title: 'ConnectionDescriptor#name is a plain field; Rails answers "ActiveRecord::Base" for a primary class'
status: draft
updated: 2026-08-07
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #6188 while converging `AbstractAdapter#preventing_writes?` onto
`connection_descriptor.current_preventing_writes`.

Rails' `ConnectionDescriptor` keeps the primary class's public name distinct
from the stored one
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:56-74`):

```ruby
class ConnectionDescriptor # :nodoc:
  def initialize(name, primary = false)
    @name = name
    @primary = primary
  end

  def name
    primary_class? ? "ActiveRecord::Base" : @name
  end

  def primary_class?
    @primary
  end

  def current_preventing_writes
    ActiveRecord::Base.preventing_writes?(@name)
  end
end
```

Two things trails does differently
(`packages/activerecord/src/connection-adapters/abstract/connection-descriptor.ts`):

1. `name` is a plain readonly field, not the `primary_class?`-conditional
   reader. `PoolConfig` normalizes a primary owner to `"Base"` on the write
   side instead, so a primary descriptor reports `"Base"` where Rails reports
   `"ActiveRecord::Base"`.
2. `primary_class?` has no reader at all — the flag is stored as `isPrimary`.
   Note `ConnectionOwner` in the same file already declares `primaryClassQ()`,
   so the Rails name is established in the codebase; the descriptor just does
   not expose it.

Note also that Rails' `current_preventing_writes` passes the **ivar** `@name`,
not the conditional reader — so the two are deliberately different values, and
collapsing them (as trails effectively has) is what forces the read-side
compensation tracked by
[[converge-preventing-writes-name-compare-drop-primary-class-promotion]].

Separately, Rails' home for this class is `connection_handler.rb`, not a file of
its own; trails' `abstract/connection-descriptor.ts` is a layout deviation that
`parity:api` resolves by short name. Fold it into
`abstract/connection-handler.ts` if that is cheap while here, but the name
semantics above are the substance.

## Converged shape

```ts
get name(): string {
  return this.primaryClassQ() ? "ActiveRecord::Base" : this._name;
}

primaryClassQ(): boolean {
  return this._primary;
}

currentPreventingWrites(): boolean {
  return isPreventingWrites(this._name);
}
```

with `PoolConfig` storing the owner's own name rather than normalizing primary
owners to `"Base"`, so the descriptor is the single place the primary-class
spelling is decided — as in Rails.

## Acceptance criteria

- [ ] `ConnectionDescriptor#name` is the `primary_class?`-conditional reader and
      `primaryClassQ()` exists; `currentPreventingWrites` passes the stored name,
      not the reader (`connection_handler.rb:71-73`).
- [ ] `PoolConfig` no longer normalizes primary owners to `"Base"`.
- [ ] Unblocks deleting the read-side promotion in
      [[converge-preventing-writes-name-compare-drop-primary-class-promotion]].
- [ ] Connection-handling, sharding, prevent-writes and database-selector suites
      green on sqlite, PostgreSQL and MySQL. No test names change.

---
title: "activerecord: a subclass inherits its parent's locking_column where Rails' inherited resets it"
status: ready
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while moving `_lockingColumn` off `Base` in trails#8657.

Rails gives every subclass its own default locking column at definition time
(`vendor/rails/v8.0.2/activerecord/lib/active_record/locking/optimistic.rb:193-198`):

```ruby
def inherited(base)
  super
  base.class_eval do
    @locking_column = DEFAULT_LOCKING_COLUMN
  end
end
```

and `locking_column` is a bare `attr_reader` (`optimistic.rb:171`). So a subclass of a model that set
`self.locking_column = :lock_person` reads `"lock_version"` again unless it sets its own.

trails' reader in `packages/activerecord/src/locking/optimistic.ts` (`ClassMethods.lockingColumn`) is
`this._lockingColumn ?? DEFAULT_LOCKING_COLUMN`. The static read walks the prototype chain, so a
subclass inherits its parent's custom column where Rails resets it.

The same file's `hookAttributeType` (`optimistic.rb:185-191`) has two more differences: the guard is
`this.lockOptimistically !== false` where Rails has `lock_optimistically &&` (a `nil` is falsy in
Ruby), and it returns `castType` where Rails calls `super`.

## Acceptance criteria

- [ ] `ClassMethods.lockingColumn` answers the class's own `_lockingColumn` behind an own-property
      guard and `DEFAULT_LOCKING_COLUMN` otherwise, the port of `inherited` ratified in CLAUDE.md
      § "`inherited` is deferred to own-property memo guards".
- [ ] A `.trails.test.ts` case: a subclass of a model with a custom `lockingColumn` reads
      `"lock_version"`; it fails on the current reader.
- [ ] `hookAttributeType` guards with Ruby truthiness on `lockOptimistically` and ends in the
      `super` call, as `optimistic.rb:185-191` does.
- [ ] `locking.test.ts` and `locking.trails.test.ts` green; `parity:api:calls` green with no new
      baseline row.

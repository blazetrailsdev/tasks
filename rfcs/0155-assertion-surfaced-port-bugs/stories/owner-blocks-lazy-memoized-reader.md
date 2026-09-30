---
title: "Owner#blocks memoizes lazily as owner.rb:25-27 (no eager _blocks field)"
status: ready
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' test model `Owner` memoizes its callback list lazily:

```ruby
def blocks
  @blocks ||= []
end
```

(`vendor/rails/v8.0.2/activerecord/test/models/owner.rb:25-27`), and
`execute_blocks` resets it with `@blocks = []` (`:33-37`).

trails' `packages/activerecord/src/test-helpers/models/owner.ts` declares an
eager class field `private _blocks: Array<...> = []` (`:21`), and `executeBlocks`
reads `this._blocks` directly (`:58-60`). A JS class field exists only on a
constructed instance, so a record allocated without its constructor (Ruby's
`allocate`) has no `_blocks` and `executeBlocks` throws
`TypeError: blocks is not iterable`. #8254 observed exactly this when trying a
constructor-free `Base.allocate` (`timestamp.test.ts` touch tests).

## Converged shape

`Owner#blocks` is the lazy reader Rails has (`return (this._blocks ??= [])`), the
field carries no initializer, and `executeBlocks` / `onAfterCommit` go through
`this.blocks`.

## Acceptance criteria

- [ ] `owner.ts` `blocks` memoizes as `owner.rb:25-27` does; no eager `_blocks` initializer.
- [ ] `timestamp.test.ts` and the transaction-callback tests using `Owner` stay green.

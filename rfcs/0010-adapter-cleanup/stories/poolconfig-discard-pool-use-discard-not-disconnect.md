---
title: "PoolConfig#discardPoolBang should call pool.discard! not disconnect! (Rails parity)"
status: ready
updated: 2026-06-24
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `PoolConfig#discard_pool!`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb`)
calls `@pool.discard!` then nils `@pool`:

```ruby
def discard_pool!
  return unless @pool
  synchronize do
    return unless @pool
    @pool.discard!
    @pool = nil
  end
end
```

trails' `PoolConfig#discardPoolBang`
(`packages/activerecord/src/connection-adapters/pool-config.ts:194`) instead
calls `this._pool.disconnectBang()`:

```ts
discardPoolBang(): void {
  if (!this._pool) return;
  this._pool.disconnectBang();
  this._pool = null;
}
```

`disconnect!` and `discard!` are NOT equivalent in Rails:
`disconnect!` closes each connection cleanly (and clears the pool for reuse);
`discard!` abandons each raw handle without closing it (used after `fork`, when
the inherited fd must not be touched). Using `disconnectBang` here changes the
teardown semantics — it actively closes handles the discard contract says to
abandon, and (post PR #4065) it now also drains async closes via
`disconnectAsync` in `discardPoolBangAsync`, which `discard!` would never do.

This is a pre-existing divergence surfaced while wiring the async-drain seams in
PR #4065 (the new `discardPoolBangAsync` mirrors the existing sync method's
`disconnect` path rather than Rails' `discard`).

## Acceptance criteria

- [ ] `PoolConfig#discardPoolBang` calls `this._pool.discardBang()` (not
      `disconnectBang`), matching Rails `discard_pool!` → `@pool.discard!`.
- [ ] `discardPoolBangAsync` (added in #4065) drains via the pool's
      discard-bang async path (`discardBangAsync`) rather than `disconnectAsync`,
      keeping the async lift consistent with the corrected sync method.
- [ ] No regression to fork-safety / pooled-handle teardown tests; verify
      `pool-config.test.ts` discardPoolBang cases still pass.
- [ ] If the swap changes observable behavior for any adapter (PG `discard!`
      ends the raw connection; SQLite `discardBang` is a no-op), confirm against
      Rails and adjust tests to match Rails, not the prior trails behavior.

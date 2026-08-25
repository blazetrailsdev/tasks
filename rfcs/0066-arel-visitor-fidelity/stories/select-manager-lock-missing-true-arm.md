---
title: "SelectManager#lock lacks Rails'  arm"
status: done
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 26
pr: 5047
claim: "2026-07-22T00:11:53Z"
assignee: "select-manager-lock-missing-true-arm"
blocked-by: null
closed-reason: null
---

## Context

Found while converging `SelectManager` in PR #5025 (story
`arel-unrouted-privates-drop-carried-arguments`); out of scope there.

`packages/arel/src/select-manager.ts` `lock()`:

```ts
lock(lockClause?: string | Node): this {
  const expr =
    lockClause === undefined ? new SqlLiteral("FOR UPDATE")
    : typeof lockClause === "string" ? new SqlLiteral(lockClause)
    : lockClause;
  this.ast.lock = new Lock(expr);
  return this;
}
```

Rails `select_manager.rb:52-63` has a `true` arm trails lacks:

```ruby
def lock(locking = Arel.sql("FOR UPDATE"))
  case locking
  when true
    locking = Arel.sql("FOR UPDATE")
  when Arel::Nodes::SqlLiteral
  when String
    locking = Arel.sql locking
  end

  @ast.lock = Nodes::Lock.new(locking)
  self
end
```

`lock(true)` is how ActiveRecord's `lock!`/`with_lock` express a default lock.
In trails the parameter type does not admit `true`, so a caller passing it
gets `Lock(true)` and the visitor sees a bare boolean. Worth checking whether
any AR caller reaches this — if one does, it is a live bug rather than a
surface gap.

## Acceptance criteria

- `lock()` accepts `true` and maps it to `SqlLiteral("FOR UPDATE")`, matching
  select_manager.rb:52-63; parameter type widened accordingly.
- The `SqlLiteral` arm stays a pass-through (Rails' empty `when` branch) —
  do not re-wrap an already-literal argument.
- Test asserts the emitted SQL for `lock(true)`, `lock("FOR SHARE")`,
  `lock(sqlLiteral)` and the no-arg default.
- Grep AR for `.lock(` callers reaching Arel and note in the PR whether any
  passed `true` before the fix.

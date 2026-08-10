---
title: "SelectManager#lock renames its parameter, changes its default, and flattens Rails' case"
status: done
updated: 2026-08-10
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6323
claim: "2026-08-10T03:06:34Z"
assignee: "port-test-date-new-civil-reform"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0095 call-argument comparator (PR #6309) measuring arel:
`SelectManager#lock` passes a literal where Rails passes its parameter.

Rails (`activerecord/lib/arel/select_manager.rb:52-63`):

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

trails (`packages/arel/src/select-manager.ts:134-145`) diverges on three of the
axes CLAUDE.md names explicitly:

- **Parameter name.** `lockClause`, where Rails' identifier is `locking`. A
  local/parameter keeps the Rails identifier, camelCased — this is free fidelity.
- **Default.** `= true`, where Rails' default is `Arel.sql("FOR UPDATE")`. The
  two are observationally close only because the `true` arm re-derives the same
  literal; they are not the same default, and a caller reading the signature
  sees the wrong one.
- **Control flow.** Rails' four-arm `case` (`true` / `SqlLiteral` / `String` /
  fallthrough) is rewritten as a nested ternary. Same branches must appear in
  the same order, with the same guards — a `case` with an EMPTY `SqlLiteral` arm
  is a deliberate no-op arm, and collapsing it into a ternary chain hides that.

Note `select-manager-lock-missing-true-arm` (0066, done) addressed the missing
`true` arm only; the signature and the `case` shape were not converged and are
what this story is for.

## Acceptance criteria

1. The parameter is `locking`, defaulting to `Arel.sql("FOR UPDATE")` — the
   Rails default, not `true`.
2. The body is Rails' `case`, arm for arm and in Rails' order, including the
   no-op `SqlLiteral` arm; no nested ternary.
3. `new Lock(locking)` is constructed from the reassigned local, as
   `select_manager.rb:62` does, and `this` is returned.
4. Existing `lock` tests keep their names and still pass; if none covers the
   bare `lock()` default, add one that fails on the `= true` baseline.

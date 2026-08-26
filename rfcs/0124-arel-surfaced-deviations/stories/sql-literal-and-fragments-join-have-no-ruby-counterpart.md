---
title: "SqlLiteral#join and Fragments#join have no counterpart in their Ruby files"
status: draft
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
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

`SqlLiteral#join` (`packages/arel/src/nodes/sql-literal.ts:85`) and
`Fragments#join` (`packages/arel/src/nodes/fragments.ts:15`) have no counterpart
in their Ruby files. `vendor/rails/activerecord/lib/arel/nodes/sql_literal.rb`
and `.../fragments.rb` each define exactly one concatenation method, `+`:

```ruby
# sql_literal.rb:25-29
def +(other)
  raise ArgumentError, "Expected Arel node" unless Arel.arel_node?(other)
  Fragments.new([self, other])
end

# fragments.rb:22-26
def +(other)
  raise ArgumentError, "Expected Arel node" unless Arel.arel_node?(other)
  self.class.new([*@values, other])
end
```

trails ports `+` as `plus` (a TS class cannot define an arithmetic operator —
the settled rename, also used by `BoundSqlLiteral#plus`). `join` is a second,
trails-only spelling that predates it. Until PR #7079 `plus` was a bare alias
for `join`; that PR moved the Rails `Arel.arel_node?` guard into `plus`, so the
two now differ in behaviour — `join` is the unguarded one, which is strictly
the non-Rails path.

`parity:api:extra` scores `join` as **moved**, not novel — the name matches a
Ruby `join` in a DIFFERENT file (`SelectManager#join`) — so the RFC 0117 ratchet
does not see it. That is exactly the weak-match case where the name survives the
gate while the member has no counterpart where it lives.

## Converged shape

Delete both `join` methods; `plus` holds the whole Rails body at each site
(`new Fragments([this, other])` and `new Fragments([...this.values, other])`
respectively). Update the handful of in-package callers.

## Acceptance criteria

- [ ] `SqlLiteral#join` and `Fragments#join` are gone; every caller uses `plus`.
- [ ] Both `plus` bodies carry the `Arel.arel_node?` guard and Rails' return
      expression verbatim.
- [ ] `pnpm parity:api:extra --package arel` shows two fewer moved members for
      `nodes/sql-literal.ts` / `nodes/fragments.ts`; the gate does not rise.
- [ ] `pnpm vitest run packages/arel/src` green.

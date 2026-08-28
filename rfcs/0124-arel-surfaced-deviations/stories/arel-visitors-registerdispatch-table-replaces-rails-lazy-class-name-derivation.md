---
title: "arel-visitors-registerdispatch-table-replaces-rails-lazy-class-name-derivation"
status: claimed
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-28T01:46:55Z"
assignee: "arel-crud-interface-holds-no-bodies"
blocked-by: null
closed-reason: null
---

## Context

Rails' visitor derives the dispatch method name from the class at runtime:

```ruby
def self.dispatch_cache
  @dispatch_cache ||= Hash.new do |hash, klass|
    hash[klass] = :"visit_#{(klass.name || "").gsub("::", "_")}"
  end.compare_by_identity
end
```

(`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:17-21`). There is no
registration table anywhere in `lib/arel/visitors/`.

trails builds one by hand. `packages/arel/src/visitors/to-sql.ts:1251-1418` is a
167-line `static registerDispatch()` with 91 `reg(Nodes.X, "visitArelNodesX")`
lines, each guarded by a prototype-method check that throws `ArelError` (the
`to-sql.ts:1255` guard named in `arel-node-slot-registration-guards-are-invented`).
`visitors/dot.ts` and `visitors/postgresql.ts` carry their own copies
(`registerDispatch` is also one of the three `@internal` declarations
`arel-enroll-unbacked-internal-receipt` lists). It is the single largest
invented block left in the package after the 2026-08-28 re-audit — a Rails
developer opening `to-sql.ts` finds 119 `visit_*` bodies they recognise,
followed by 167 lines Rails does not have.

The derivation already exists as the _fallback_: `visitor.ts:67-79
dispatchMethod` tries the table, then `rubyClassName(object)`, then
`visit${rubyClass}`; and `resolveDispatch` (`visitor.ts:85-101`) already walks
the prototype chain and caches, which is Rails' `rescue NoMethodError …
superklass … retry` (`visitor.rb:34-42`). The table is therefore a cache Rails
fills lazily, pre-filled by hand.

The one real question is **class names at runtime**: Rails reads
`klass.name`; the TS equivalent is `ctor.name`, which a minifier can rewrite.
arel's published `dist/` is unminified ESM and the `Nodes` namespace is what
`registerDispatch` reads anyway, so the same names are already load-bearing
for `nodes/index.ts`; but a consumer bundling with name-mangling on would
lose dispatch. That is a documented support boundary to decide, not a
reason to keep 167 lines.

## Acceptance criteria

- `Visitor.dispatchCache` fills lazily from the class, as visitor.rb:17-21:
  the key is the constructor, the value is `visit` + the Ruby-shaped class
  name (`Arel::Nodes::SelectCore` → `visitArelNodesSelectCore`), using the
  same `rubyClassName` mapping `dispatchMethod` already uses for non-node
  values and the `Nodes` namespace for arel node classes (so the mapping does
  not depend on `ctor.name` alone if the boundary decision says it must not).
- `registerDispatch` is deleted from `to-sql.ts`, `dot.ts`, `postgresql.ts`
  (and `mysql.ts` / `sqlite.ts` if present), along with the
  prototype-method guard; `Visitor#visit`'s miss path is the prototype walk
  - `TypeError "Cannot visit …"` (visitor.rb:39), nothing else.
- The minification boundary is written down once, as a `PERMANENT` receipt
  on `dispatchCache` or a line in the package README — not per visitor.
- `pnpm parity:api --package arel` 957/957; `parity:api:extra:gate` no worse
  (the `@internal registerDispatch` names disappear, which only lowers the
  measured total); `parity:api:calls` unchanged.
- All arel visitor tests green (`to-sql`, `dot`, `postgres`, `mysql`,
  `sqlite`, `visitor`, and the `.trails` twins); no test renamed.
- `packages/arel/src/visitors/to-sql.ts` line ratio to `to_sql.rb` drops
  from 1.37x toward ~1.2x; report the number in the PR.

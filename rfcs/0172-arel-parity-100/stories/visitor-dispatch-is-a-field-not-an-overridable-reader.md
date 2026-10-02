---
title: "arel: Visitor#dispatch is a field where Rails has an overridable attr_reader; port 'can define a dispatch method' as written"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Visitor` declares `attr_reader :dispatch` in its private section
(`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:14-15`) and `visit` reads it by
calling the reader (`:28`). A subclass may therefore override `dispatch`, and Rails' own test does:

```ruby
viz = Class.new(Arel::Visitors::Visitor) {
  define_method(:hello) do |node, c| visited = true end
  def dispatch
    { Arel::Table => "hello" }
  end
}.new
```

(`vendor/rails/v8.0.2/activerecord/test/cases/arel/visitors/to_sql_test.rb:33-47`).

trails declares `protected dispatch: Hash<Klass, string>` as an instance FIELD assigned in the
constructor (`packages/arel/src/visitors/visitor.ts`). A subclass `get dispatch()` cannot
override a field the base constructor assigns, so `packages/arel/src/visitors/to-sql.test.ts`
"can define a dispatch method" instead writes into the class-level cache
(`this.dispatchCache().set(Table, "hello")`), which is not what the Rails test exercises.

## Acceptance criteria

- [ ] `dispatch` is a reader a subclass can override (an accessor over the `@dispatch` seat the
      constructor fills from `getDispatchCache()`), still `@internal` / protected.
- [ ] "can define a dispatch method" overrides `dispatch` to answer a hash mapping `Table` to
      `"hello"`, as `to_sql_test.rb:40-42`, with no `dispatchCache()` write.
- [ ] `pnpm parity:api` arel stays 100%; `parity:api:extra:gate` stays green.

## Verification

```bash
pnpm vitest run packages/arel/src/visitors
```

---
title: "arel-dot-accept-requires-collector"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8373
claim: "2026-10-02T01:22:05Z"
assignee: "arel-dot-accept-requires-collector"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Dot#accept` takes a required collector and appends to it
(`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/dot.rb:28-31`):

```ruby
def accept(object, collector)
  visit object
  collector << to_dot
end
```

trails' port (`packages/arel/src/visitors/dot.ts:29-45`) declares the collector
optional (`collector?: unknown`), duck-types it through a file-local
`isAppendableCollector` helper Rails does not have (`dot.ts:11-17`), and falls
back to `new PlainString()` when the caller passes none. It also resets
`nodes` / `edges` / `nodeStack` / `edgeStack` / `seen` / `nextId` and seeds
`dispatch` with `Table` on every call, none of which `accept` does in Rails
(the ivars are set once in `initialize`, `dot.rb:19-26`).

The fallback's only caller was the invented `Dot#compile`, deleted by
`arel-burn-moved-extra-surface-managers-collectors-namespaces`; every remaining
caller (`tree-manager.ts` `toDot`, the dot tests) passes a collector.

Tried in trails#8345 and backed out: an override spelled
`accept<C extends { append(str: string): C }>(object: Nodes.Node, collector: C): C`
fails `TS2416` against `Visitor#accept`'s overload list
(`packages/arel/src/visitors/visitor.ts`), whose one-argument overload
`accept(object: unknown): unknown` a two-required-parameter override cannot
satisfy. Rails' base is `def accept(object, collector = nil)`
(`arel/visitors/visitor.rb`), so the fix has to start at the base overloads,
which `ToSql#compile`'s callers rely on for the `C` return type.

## Acceptance criteria

- [ ] `Dot#accept(object, collector)` requires the collector and is `visit(object)` then `collector.append(this.toDot())`, returning what `<<` returns, as `dot.rb:28-31`.
- [ ] `isAppendableCollector` and the `PlainString` fallback are deleted.
- [ ] The per-call state reset and the `dispatch.set(Table, …)` seeding either move to where Rails has them (`initialize`, `dot.rb:19-26`; the dispatch table) or are deleted; tests that reuse one `Dot` across calls construct one per call as `dot_test.rb:9-11`'s `setup` does.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline row.

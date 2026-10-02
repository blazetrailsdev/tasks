---
title: "arel: Dot#visit keys seen by a hand-built key and numbers nodes from a counter where Rails uses object_id"
status: done
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: trails#8399
claim: "2026-10-02T14:02:12Z"
assignee: "arel-remaining-nil-sends-read-ruby-compat-is-nil"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8373 (`arel-dot-accept-requires-collector`).

`Arel::Visitors::Dot#visit` keys its seen-table and its node ids by `object_id` (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/dot.rb:247-259`):

```ruby
def visit(o)
  if node = @seen[o.object_id]
    @edge_stack.last.to = node
    return
  end

  node = Node.new(o.class.name, o.object_id)
  @seen[node.id] = node
  @nodes << node
  with_node node do
    super
  end
end
```

trails' port (`packages/arel/src/visitors/dot.ts`, `visit`) builds a `seenKey` by hand (a `NIL_SENTINEL` symbol, `boolean:` / `number:` / `bigint:` string prefixes, the object itself, and `undefined` for a string, which is then never looked up), keys `seen` by it, and numbers nodes from a `nextId` counter field Rails does not have. It also takes an unused `_collector` parameter and guards `edgeStack` with `if (e)` where Rails calls `@edge_stack.last.to = node` unguarded.

## Converged shape

`visit(o)` reads `this.seen.get(rbObjId(o))`, builds `new Node(rbObjClass(o), rbObjId(o))`, stores `this.seen.set(node.id, node)`, with ruby-compat's `rbObjId` supplying the id. `nextId`, `NIL_SENTINEL` and the `seenKey` closure are deleted.

## Acceptance criteria

- `Dot#visit` is the five statements of `dot.rb:247-259` with no `nextId`, `NIL_SENTINEL` or `seenKey`.
- Ids come from ruby-compat's `rbObjId`, including for `nil`, booleans and numbers.
- `packages/arel/src/visitors/dot.test.ts` and `dot.trails.test.ts` stay green; `pnpm parity:api:calls` and `parity:api:calls:args` stay green with no new row.

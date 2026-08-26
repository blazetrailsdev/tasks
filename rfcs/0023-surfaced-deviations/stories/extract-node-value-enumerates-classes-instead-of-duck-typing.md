---
title: "extract_node_value enumerates node classes where Rails duck-types respond_to?(:value_before_type_cast)"
status: draft
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7064 (RFC 0124,
`converge-arel-build-quoted-model-attribute-unwrapped`). That PR made
`build_quoted` seat an `ActiveModel::Attribute` unwrapped
(`vendor/rails/activerecord/lib/arel/nodes/casted.rb:50-51`), which broke
`scope_for_create` until a fourth `instanceof` arm was added here — the tell
that the shape is wrong.

Rails' `extract_node_value`
(`vendor/rails/activerecord/lib/active_record/relation/where_clause.rb:209-215`)
is three lines and duck-typed:

```ruby
def extract_node_value(node)
  if node.respond_to?(:value_before_type_cast)
    node.value_before_type_cast
  elsif Array === node
    node.map { |v| extract_node_value(v) }
  end
end
```

`packages/activerecord/src/relation/where-clause.ts:335-354` is a class list
instead — `ModelAttribute`, `Nodes.Quoted`, `Nodes.Casted`, `Nodes.BindParam`,
`Array`, then `return node`. Two divergences follow from that:

- **Every new node type answering `value_before_type_cast` needs a new arm.**
  `Casted`, `Quoted` (`casted.rb:7`, `:38`), `BindParam` and
  `ActiveModel::Attribute` all answer it in Ruby and are covered by Rails' one
  `respond_to?`; trails enumerates them and will keep needing rows.
- **The fallthrough returns the wrong thing.** Ruby's `if/elsif` with no `else`
  answers `nil`, so a node answering neither contributes `nil` to
  `where_values_hash`. trails returns `node` — the node object itself — which
  is a different value for `scope_for_create` / `create_with` to carry.

The `BindParam` arm also reaches one level deeper than Rails does
(`if "value" in val` → `val.value`), because trails' `BindParam` wraps a
`QueryAttribute`; Rails' `BindParam#value_before_type_cast`
(`bind_param.rb`) does that unwrap itself. Check whether that belongs on the
node rather than at this call site.

## Converged shape

Replace the class list with the `respond_to?` duck-type — a check for a
`valueBeforeTypeCast` member, calling it if it is a method and reading it if it
is a getter (activemodel's `Attribute` exposes a getter,
`activemodel/src/attribute.ts:98`; `Casted`/`Quoted` expose methods) — then the
`Array` arm, then `undefined`. Confirm each node type reached in practice
answers it, moving the `BindParam` unwrap onto `BindParam` if that is what makes
the duck-type hold.

Flipping the fallthrough from `node` to `undefined` is the behavioural half:
audit `whereValuesHash` / `scopeForCreate` callers for anything relying on the
node coming back.

## Acceptance criteria

- [ ] `extractNodeValue` matches `where_clause.rb:209-215` — one duck-typed
      check, the `Array` arm, and a nil fallthrough; no per-class `instanceof`
      list.
- [ ] A test covers a node answering `valueBeforeTypeCast` that has no arm
      today, and one answering nothing (which must yield nil, not the node).
- [ ] `pnpm parity:api:calls` clean for the body; activerecord relation +
      relations suites green.

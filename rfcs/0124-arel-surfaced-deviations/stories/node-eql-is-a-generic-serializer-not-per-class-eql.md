---
title: "Node#eql/#hash is one generic serializer where Rails defines eql?/hash per node class"
status: in-progress
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 7107
claim: "2026-08-26T23:55:46Z"
assignee: "node-eql-is-a-generic-serializer-not-per-class-eql"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `predications-between-bound-equality-is-reference-equality`
(PR #7067), which made `between`'s degenerate-range arm dispatch Ruby `==` via
`rbEqual` — so `Node#eql` is now load-bearing on a predicate path, not just in
tests.

**Rails has no base-class `eql?` on `Arel::Nodes::Node` at all.**
`activerecord/lib/arel/nodes/node.rb` defines none. Each node class defines its
own over its OWN fields, and aliases `==` to it:

- `nodes/binary.rb:20-28` — `hash` is `[self.class, @left, @right].hash`;
  `eql?` is `self.class == other.class && self.left == other.left &&
self.right == other.right`; `alias :== :eql?`.
- `nodes/unary.rb:14-22` — the same shape over `@expr`.
- `nodes/casted.rb:25-33` — `[self.class, value, attribute].hash`, and
  `eql?` over `value` / `attribute`.

Note what those bodies compare with: Ruby `==`, recursively, so a nested node
compares by ITS class's `eql?`, and a `Date`/`BigDecimal` field compares by
value.

trails instead puts ONE generic method on the base
(`packages/arel/src/nodes/node.ts`, `eql(other)` and `hash()`): it rejects any
non-object, requires `constructor` identity, then compares
`stableSerialize(this) === stableSerialize(other)`, with `hash()` as
`fnv1a32(stableSerialize(this))`. That is a whole-object structural digest, not
Rails' per-class field list, and it diverges in both directions:

- **Too wide** — it compares every own property, including ones Rails' `eql?`
  deliberately omits (the `SqlLiteral#retryable` case is already filed
  separately as `sqlliteral-eql-compares-by-sql-text`; that story patches ONE
  subclass, this one is the base-class cause).
- **Too narrow** — a field whose value equality is not structural
  (a `Temporal.PlainDate`, an `ActiveModel::Attribute`, anything whose Ruby
  `==` is not "same serialized shape") compares by its serialization rather
  than by its own `==`, where Rails recurses into `==`.

`Node#eql` / `Node#hash` are also extra surface with no Ruby counterpart on
that class — `parity:api:extra` reports both as `moved` (the names exist on
Binary/Unary/Casted in Ruby) rather than novel, which is exactly why the
divergence has stayed invisible.

## Converged shape

Delete the generic `eql` / `hash` from `Node` and define them per class, where
Rails does, each over that class's own fields and each comparing with the Ruby
`==` analogue (`rbEqual`, `packages/activesupport/src/rb-equal.ts`) rather than
`===` or a serialization:

- `Binary` (and its subclasses, which inherit it) — `nodes/binary.rb:20-28`
- `Unary` — `nodes/unary.rb:14-22`
- `Casted` — `nodes/casted.rb:25-33`
- `Nary`, and any other node Rails gives its own pair

Land `sqlliteral-eql-compares-by-sql-text` first or together — that subclass's
override is the same fix one level down, and this story removes the base method
it is currently overriding.

Check the blast radius before deleting the base method: `Node#eql` is reached
from `rbEqual` (predications.ts's `between`), from `predicateEql`
(`packages/activerecord/src/relation/where-clause.ts`), and from a large number
of arel tests. A node class Rails gives NO `eql?` should end up with Ruby's
default identity comparison, not a silently inherited structural one.

## Acceptance criteria

- [ ] No `eql` / `hash` on `Node`; each node class that has them in Rails
      defines them over the same fields Rails lists, in the same order.
- [ ] The bodies compare with `rbEqual`, so a `Date` / `Attribute` / nested-node
      field compares by ITS `==`, matching Ruby's recursion.
- [ ] `stableSerialize` has no remaining equality caller (delete it if it has
      none at all — it is trails-only).
- [ ] `pnpm vitest run packages/arel` green; AR where-clause / relation-merge
      suites green on all three adapter lanes.
- [ ] `pnpm parity:api:extra:gate` green with arel's mark unchanged or narrowed.

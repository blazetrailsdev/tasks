---
title: "arel-in-not-in-scalar-arm-quoted-node"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4881 (arel-in-not-in-threads-attribute-through-quoted-array),
which converged the Enumerable arm of `Attribute#in` / `#notIn` onto
`quotedArray` so elements become `Casted(v, attr)`. The scalar arm was left
out of that PR: it is a separate divergence and widens the public signature.

Rails (`arel/predications.rb:65-74`) has three arms:

```ruby
def in(other)
  case other
  when Arel::SelectManager then Arel::Nodes::In.new(self, other.ast)
  when Enumerable          then Nodes::In.new self, quoted_array(other)
  else                          Nodes::In.new self, quoted_node(other)
  end
end
```

`not_in` mirrors it (`predications.rb:120-129`).

Trails (`packages/arel/src/attributes/attribute.ts:204-217`) implements only the
first two arms. Its signature is `in(values: unknown[] | { ast: Node })`, so the
`else` arm does not exist: a scalar falls past both guards into
`this.quotedArray(scalar)`, whose `others.map(...)` raises TypeError. Rails
instead builds `In(self, Casted(scalar, self))`.

The wide-call ratchet still carries the matching entries, which flag legitimately
and should be deleted by hand when this converges (the ratchet only shrinks — do
not blind-reseed):

- `arel  attributes/attribute.ts  in  quoted_node`
- `arel  attributes/attribute.ts  not_in  quoted_node`

## Acceptance criteria

- [ ] `in` / `notIn` accept a scalar and build `In(self, quotedNode(v))` /
      `NotIn(self, quotedNode(v))`, mirroring `predications.rb:65-74` and
      `120-129`.
- [ ] Enumerable arm still routes through `quotedArray`; `SelectManager` arm
      still yields `In(self, other.ast)`.
- [ ] Signature widened to admit the scalar without loosening the array/ast
      arms into `any`.
- [ ] Coverage that a scalar type-casts through the column (`Casted`, not
      bare `Quoted`).
- [ ] The two `quoted_node` wide-ratchet entries above deleted by hand;
      `pnpm api:calls:wide` green.
- [ ] api:compare / test:compare delta non-negative.

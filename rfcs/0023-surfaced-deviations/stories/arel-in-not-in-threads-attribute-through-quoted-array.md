---
title: "arel-in-not-in-threads-attribute-through-quoted-array"
status: ready
updated: 2026-07-14
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

Surfaced by review of PR #4874 (arel-attribute-quoted-node-nil-builds-casted),
which converged `Attribute#quotedNode` onto `buildQuoted(value, this)` so a nil
becomes `Casted(nil, attr)` and type-casts through the column. `in` / `notIn`
are the same bug one arm over and were left out of that PR for scope.

Rails (`arel/predications.rb:65-74`):

```ruby
def in(other)
  case other
  when Arel::SelectManager then Arel::Nodes::In.new(self, other.ast)
  when Enumerable          then Nodes::In.new self, quoted_array(other)
  else                          Nodes::In.new self, quoted_node(other)
  end
end
```

`quoted_array(others)` is `others.map { |v| quoted_node(v) }`
(`predications.rb:227-229`), and `quoted_node(v)` is `build_quoted(v, self)`
(`predications.rb:244-246`) — so every element becomes `Casted(v, self)`,
carrying the column's type-cast context.

Trails (`packages/arel/src/attributes/attribute.ts:202-214`) instead does:

```ts
return new In(this, values.map(buildQuoted) as unknown as Node);
```

Two defects:

1. **No attribute is threaded**, so elements become bare `Quoted` and skip the
   column type-cast. `attr.in([null])` builds `Quoted(null)`, exactly the
   divergence #4874 fixed for `eq`. Any type whose `serialize` of a value is
   non-identity (serialized / normalized / enum columns) diverges.
2. **`values.map(buildQuoted)` passes the array INDEX as the second arg.**
   `Array#map` invokes `(value, index, array)`, so this calls
   `buildQuoted(v, 0)`, `buildQuoted(v, 1)`, … The attribute slot receives a
   number; `isAttribute(0)` is false, so it falls through to `Quoted`. It
   reaches the current (wrong) answer for the wrong reason — and would start
   mis-binding if the second arg were ever honored. Same pattern on `notIn`.

`Attribute#quotedArray` (`attribute.ts:595-598`) already does the right thing
(`others.map((v) => buildQuoted(v, this))`) and `in` simply does not call it.

Note `packages/activerecord/src/relation.ts:1169` carries a comment
("Attribute#in uses buildQuoted (no type-caster context); the values were
already ...") indicating AR compensates by pre-casting upstream — check whether
that workaround can be dropped once `in` threads the attribute, and whether
removing it changes any AR SQL.

Beware: converging this will make wide-call-ratchet baseline entries stale
(`attributes/attribute.ts in quoted_array`, `not_in quoted_array`,
`eq_all quoted_array`, `in quoted_node`, `not_in quoted_node` all exist in
`scripts/api-compare/call-mismatches-wide-exclude.json`). The ratchet only
shrinks — delete converged entries by hand, do not blind-reseed.

## Acceptance criteria

- [ ] `in` / `notIn` route Enumerable elements through `quotedArray` /
      `quotedNode` so each becomes `Casted(v, this)`, mirroring
      `predications.rb:65-74`.
- [ ] The `map(buildQuoted)` index-as-attribute bug is gone (no bare function
      reference passed to `map`).
- [ ] `SelectManager` arm still yields `In(self, other.ast)`.
- [ ] Coverage that `attr.in([null])` type-casts through the column, and that
      `IN` / `NOT IN` SQL is unchanged for plain scalars.
- [ ] Re-check the `relation.ts:1169` pre-cast workaround.
- [ ] api:compare / test:compare delta non-negative; wide ratchet green.

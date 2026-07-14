---
title: "arel-attribute-quoted-node-nil-builds-casted"
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

Surfaced by review of PR #4873 (arel-raw-value-dispatch-raises-like-rails).

Rails' `Nodes.build_quoted(other, attribute)` (`casted.rb:48-58`) wraps a raw
value against the attribute whenever one is supplied:

```ruby
def self.build_quoted(other, attribute = nil)
  case other
  when Arel::Nodes::Node, Arel::Attributes::Attribute, Arel::Table,
       Arel::SelectManager, Arel::Nodes::SqlLiteral, ActiveModel::Attribute
    other
  else
    case attribute
    when Arel::Attributes::Attribute
      Casted.new other, attribute
    else
      Quoted.new other
    end
  end
end
```

`Predications#quoted_node(other)` is `Nodes.build_quoted(other, self)`
(`arel/predications.rb`), so from an Attribute **every** non-pass-through raw
value — including `nil` — becomes `Casted(value, attribute)`. Rails has no
nil special-case.

Trails' `Attribute#quotedNode`
(`packages/arel/src/attributes/attribute.ts:149-159`) special-cases nil:

```ts
if (value === null || value === undefined) return new Quoted(null);
```

so `attr.eq(null)` builds `Equality(attr, Quoted(null))` where Rails builds
`Equality(attr, Casted(nil, attr))`.

Why it matters beyond node identity: `Casted#value_for_database` type-casts
through the attribute (`casted.rb:17-23` — `attribute.type_cast_for_database(value)`
when `able_to_type_cast?`), whereas `Quoted#value_for_database` is a bare
`alias :value_for_database :value` (`casted.rb:38`). A nil routed through
Quoted therefore skips the column's type-cast, so any type whose
`serialize(nil)` is not nil (a serialized/normalized column) diverges.

The `IS NULL` rendering is NOT affected — both wrappers define
`nil?` as `value.nil?` (`casted.rb:15`, `casted.rb:41`), and PR #4873 added
the `Casted(null)` arm to `rightIsNull` (`to-sql.ts:2205-2214`), so both spell
`IS NULL` today. This story is about the construction side only.

Scoped out of #4873 deliberately: that story converges raw-value dispatch in
`visitNodeOrValue`; this is node construction in `attribute.ts` with
type-cast consequences on the AR write/predicate path.

## Acceptance criteria

- [ ] `Attribute#quotedNode` drops the nil special-case so a nil becomes
      `Casted(null, this)`, mirroring `build_quoted(other, self)`
      (`casted.rb:48-58`) — or the special-case is documented with the Rails
      anchor and the caller requiring it.
- [ ] `attr.eq(null)` still renders `IS NULL` (guarded by `rightIsNull`'s
      Casted arm, already present).
- [ ] Confirm nil now type-casts through the attribute for serialized /
      normalized columns, and add coverage for whichever type exposes the
      difference (a type whose `serialize(nil)` is non-nil).
- [ ] Check the `ModelAttribute → BindParam` arm above it against Rails'
      `ActiveModel::Attribute` pass-through in `build_quoted`'s case list.
- [ ] api:compare / test:compare delta non-negative.

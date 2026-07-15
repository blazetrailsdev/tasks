---
title: "arel-attribute-caster-is-a-trails-invention"
status: done
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4877
claim: "2026-07-14T21:21:14Z"
assignee: "arel-attribute-caster-is-a-trails-invention"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4874 (arel-attribute-quoted-node-nil-builds-casted).

Rails' `Arel::Attributes::Attribute` is a two-member struct
(`arel/attributes/attribute.rb:5`):

```ruby
class Attribute < Struct.new :relation, :name
  def type_cast_for_database(value)
    relation.type_cast_for_database(name, value)
  end

  def able_to_type_cast?
    relation.able_to_type_cast?
  end
end
```

There is **no** `caster` member: type-casting delegates solely to `relation`.
Correspondingly `Nodes::Casted#value_for_database` (`casted.rb:17-23`) has
exactly one arm:

```ruby
def value_for_database
  if attribute.able_to_type_cast?
    attribute.type_cast_for_database(value)
  else
    value
  end
end
```

Trails invented an optional third constructor arg on `Attribute`
(`packages/arel/src/attributes/attribute.ts:109-114` — `caster?: TypeCaster`)
plus a matching first arm in `Casted#valueForDatabase`
(`packages/arel/src/nodes/casted.ts`):

```ts
if (attr?.caster?.typeCastForDatabase) {
  return attr.caster.typeCastForDatabase(this.value);
}
```

Audit done during #4874 review: **no production site passes a caster.** The
only `new Attribute(...)` calls are `Table#get` (`table.ts:188`),
`Table#get("*")` (`table.ts:206`) and `TableAlias#get`
(`table-alias.ts:67`), all two-arg. The arm fires only for attributes
hand-constructed in tests (`attributes/attribute.test.ts:1070-1090`,
"type casts when given an explicit caster" x2).

PR #4874 left the arm in place (deleting it blind would have silently dropped
those two tests) and documented it with an `@internal` DEVIATION note citing
this story. Converge here.

Check `packages/arel/src/nodes/homogeneous-in.ts:53-67` before deleting: it
reads `attribute.type_caster`, which is the _Rails_ `type_caster` method
(`attribute.rb:12-14`, `relation.type_for_attribute(name)`) and is a different
thing from the invented `caster` field — do not conflate the two.

## Acceptance criteria

- [ ] `Attribute`'s third `caster` constructor arg is removed so the shape
      matches `Struct.new :relation, :name` (`attribute.rb:5`).
- [ ] `Casted#valueForDatabase` keeps only the `able_to_type_cast?` /
      `type_cast_for_database` arm, mirroring `casted.rb:17-23`.
- [ ] The two "type casts when given an explicit caster" tests are deleted
      (they assert a trails-only surface), not rewritten to keep it alive.
- [ ] `homogeneous-in.ts`'s `type_caster` use is confirmed unaffected.
- [ ] The `@internal` DEVIATION note added by #4874 in `casted.ts` is removed
      along with the arm it documents.
- [ ] api:compare / test:compare delta non-negative.

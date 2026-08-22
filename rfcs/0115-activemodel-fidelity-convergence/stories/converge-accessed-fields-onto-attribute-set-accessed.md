---
title: "converge-accessed-fields-onto-attribute-set-accessed"
status: ready
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
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

`attribute_methods.rb:460-462` is two lines:

```ruby
def accessed_fields
  @attributes.accessed
end
```

`AttributeSet#accessed` (`activemodel/attribute_set.rb:93`) selects the
attributes whose `has_been_read?` is true, and `has_been_read?` is set inside
`Attribute#value` — so in Rails EVERY read path feeds it: `read_attribute`,
`_read_attribute`, the generated reader, `[]`.

trails does not use that mechanism. `packages/activerecord/src/attribute-methods.ts`'s
`accessedFields` returns `[...this._accessedFields]`, a `Set<string>` on the
record (`packages/activemodel/src/model.ts:1359`) that each read path has to
remember to `.add()` to by hand — currently only `readGeneratedAttribute`
(`attribute-methods/read.ts`) and `readAttribute` (restored in #6846 after the
move dropped it). Any other read path silently under-reports.

trails HAS the Rails mechanism: `AttributeSet#accessed` and
`Attribute#hasBeenRead()` both exist and work
(`packages/activemodel/src/attribute-set.ts:189`, `attribute.ts:192`), and
`fetchValue` → `attr.value` sets the flag.

**Blocker to converge today:** `Model#_writeAttribute`
(`packages/activemodel/src/model.ts:1488-1494`) eagerly calls
`this._attributes.fetchValue(name)` right after `writeFromUser`, to hand the
cast value to dirty tracking. That marks the attribute read on WRITE, so
`_attributes.accessed()` reports every assigned attribute. Rails' `write_from_user`
builds a `FromUser` attribute whose `@value` is not yet computed, leaving
`has_been_read?` false — which is why `attribute_methods_test.rb:1308`'s
`assert_equal [], model.accessed_fields` holds after a `new`.

**Second blocker, measured:** moving the marker one level up — into
`_readAttribute`, where the `fetchValue` call lives — so that every read path
feeds it the way Rails does, reds
`packages/activerecord/src/relations.test.ts > RelationTest > loading with one
association`. That test ends in
`expect(postWithLastComment.lastComment).toEqual(directLastComment)`, and
`toEqual` walks own enumerable properties, so `_accessedFields` is part of
structural equality: two records holding the same row but reached by different
read paths stop comparing equal. Rails' counterpart
(`relations_test.rb:751`, `assert_equal Post.find(1).last_comment,
post.last_comment`) compares with `AR::Core#==`, which is `comparison_object.id
== id` — ivars never enter it. So widening the marker needs the record
comparison to stop being structural first, or `_accessedFields` to stop being an
own enumerable field.

So this story is really three: stop `_writeAttribute` from forcing the read,
stop `_accessedFields` leaking into structural equality, then delete it.

## Acceptance criteria

- `_writeAttribute` gets the cast value for dirty tracking without marking the
  attribute read (Rails reaches `type.changed?` from `Attribute#changed?`,
  `attribute.rb:155-160`, not from an eager `fetch_value`).
- `accessedFields` is `this._attributes.accessed()` — the literal Rails body.
- `_accessedFields` is deleted from `model.ts`, `read.ts` and
  `attribute-methods.ts`; no read path hand-maintains it.
- `packages/activerecord/src/attribute-methods.test.ts`'s `accessed_fields` test
  and the `marks the field accessed when read through readAttribute` regression
  test in `attribute-methods.trails.test.ts` both stay green.
- `packages/activerecord/src/mixin.test.ts:36-38`'s comment about
  `fetchValue` not adding to `_accessedFields` is retired with the field.

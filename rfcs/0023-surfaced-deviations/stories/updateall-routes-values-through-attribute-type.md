---
title: "updateall-routes-values-through-attribute-type"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - relation-test-canonical
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation#updateAll` (packages/activerecord/src/relation.ts:3981-3997) builds its
`SET col = value` assignments by passing scalar values **raw** as binds — it only
special-cases `array` / `Range` / `SqlLiteral`. The bind is then type-cast by the
connection using the **column's schema type**, so an attribute-declared _custom_
type's `cast`/`serialize` never runs.

Rails routes every value through the attribute type instead
(`vendor/rails/activerecord/lib/active_record/relation.rb` `_substitute_values`):

```ruby
def _substitute_values(values)
  values.map do |name, value|
    attr = table[name]
    unless Arel.arel_node?(value)
      type = klass.type_for_attribute(name)
      value = predicate_builder.build_bind_attribute(name, type.cast(value))
    end
    [attr, value]
  end
end
```

This was surfaced by porting `relation_test.rb`'s
`test_update_all_goes_through_normal_type_casting` (relation_test.rb:381-412) onto
the canonical schema in PR #4192. That test defines a custom
`EnsureRoundTripTypeCasting` type and asserts `update_all` stores the
`serialize`d value and reads back the `deserialize`d value. Against trails it
fails: `updateAll` stores the raw `"value from user"` (the attribute type's
`serialize` is bypassed). The faithful test is therefore committed as `it.fails`
in `packages/activerecord/src/relation.test.ts` with a pointer to this story, so
CI keeps running it and flips red once the deviation is fixed.

**Known blocker (verified in PR #4192):** simply routing the SET value through
`predicateBuilder.buildBindAttribute(key, val)` (producing a `QueryAttribute`)
breaks 24 update-all tests — the UPDATE-SET visitor
(`packages/arel/src/visitors/to-sql.ts` `visitArelNodesAssignment` →
`visitNodeOrValue` → `quote`) tries to _quote_ the `QueryAttribute` object
directly rather than threading it as a bind the way the WHERE path does. The fix
must also teach the SET-clause path to collect `QueryAttribute` binds.

## Acceptance criteria

- [ ] `Relation#updateAll` routes non-Arel scalar assignment values through the
      attribute type (mirror Rails `_substitute_values`: cast via
      `type_for_attribute(name)` and bind so the type's `serialize` runs), and the
      UPDATE-SET visitor threads those binds instead of quoting the object.
- [ ] Un-skip `update all goes through normal type casting` in
      `packages/activerecord/src/relation.test.ts` (remove `.skip`); it passes.
- [ ] No regressions in existing `updateAll` / persistence tests across all three
      adapters.

---
title: "update-columns-raises-missing-attribute-error"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Relation#update_columns` writes each attribute through
`@attributes.write_cast_value(k, v)`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:617`), so an
unknown column raises `ActiveModel::MissingAttributeError` from the attribute
set itself. `attribute_methods_test.rb:403-407` asserts exactly that:

```ruby
assert_raises(ActiveModel::MissingAttributeError) { topic.update_columns(no_column_exists: "Hello!") }
assert_raises(ActiveModel::UnknownAttributeError) { topic.update(no_column_exists: "Hello!") }
assert_raises(ActiveModel::MissingAttributeError) { topic[:no_column_exists] = "Hello!" }
```

trails' `updateColumns` (`packages/activerecord/src/persistence.ts:678-683`)
adds a pre-check Rails has no counterpart for:

```ts
const known = Object.hasOwn(attributeTypes, key);
if (!known && !pkCols.includes(key)) {
  throw new UnknownAttributeError(this, key);
}
```

so the first arm raises `ActiveRecord::UnknownAttributeError` where Rails raises
`ActiveModel::MissingAttributeError`. Surfaced while porting the assertions in
`packages/activerecord/src/attribute-methods.test.ts` (RFC 0132); that test
currently asserts the trails behaviour with the divergence noted here.

## Acceptance criteria

- `updateColumns` routes the write through `writeCastValue` and lets
  `MissingAttributeError` surface, rather than pre-checking with an invented
  `UnknownAttributeError` raise.
- `attribute-methods.test.ts`'s
  `write_attribute raises ActiveModel::MissingAttributeError when the attribute does not exist`
  asserts `MissingAttributeError` for the `updateColumns` arm, matching
  `attribute_methods_test.rb:403-407`.
- `pnpm parity:test -- --package activerecord --assertions` does not regress.

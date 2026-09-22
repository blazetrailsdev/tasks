---
title: "generate-members-for-result-set-only-attributes"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

A record loaded through `find_by_sql` with extra SELECT expressions carries
attributes that are not columns of the model, and Rails generates the full
member set for them — reader, writer and `?` predicate — because
`define_attribute_methods` works off the record's attribute set, not off
`column_names`. `attribute_methods_test.rb:620-639` depends on all three:

```ruby
object = Company.find_by_sql("SELECT c1.*, c2.type as string_value, c2.rating as int_value ...").first
assert_equal "Firm", object.string_value
assert_predicate object, :string_value?
object.string_value = "  "
assert_not_predicate object, :string_value?
```

In trails only the **reader** is generated. Measured on that record
(`packages/activerecord/src/attribute-methods.test.ts`, `custom field attribute
predicate`):

- `object.string_value` → `"Firm"` (reader present)
- `object.attributeNames()` includes `string_value` and `int_value`
- `object["string_value?"]` → `undefined` (no predicate member)
- `object.string_value = "  "` → `TypeError: Cannot set property string_value
of #<Client> which has only a getter` (no writer half)

The ported test therefore calls the methods the generated members delegate to —
`queryAttribute` (`attribute_methods/query.rb`) and `writeAttribute`
(`attribute_methods/write.rb:36`) — rather than the generated `string_value?` /
`string_value=`. That keeps the assertion parity but does not exercise the
generation path Rails' test is actually about.

Note the reader-only shape is not the ratified one: CLAUDE.md § "Generated
attribute readers are properties" says one descriptor carries BOTH halves, so a
generated reader property should already carry its write half.

## Acceptance criteria

- A record loaded with extra SELECT expressions gets reader, writer and `?`
  predicate members for those attributes, as `define_attribute_methods` does in
  Rails.
- `custom field attribute predicate` in
  `packages/activerecord/src/attribute-methods.test.ts` asserts through the
  generated `string_value?` / `string_value=` / `int_value?` / `int_value=`
  members, as `attribute_methods_test.rb:620-639` does, instead of
  `queryAttribute` / `writeAttribute`.
- `pnpm parity:test -- --package activerecord --assertions` does not regress.

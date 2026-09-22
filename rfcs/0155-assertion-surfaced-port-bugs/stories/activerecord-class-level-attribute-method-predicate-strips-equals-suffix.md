---
title: "activerecord-class-level-attribute-method-predicate-strips-equals-suffix"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `attribute_methods_test.rb` assertions for
`assertions-tail-root-7`.

`ActiveRecord::AttributeMethods::ClassMethods#attribute_method?`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:224-226`) is
not ported:

```ruby
def attribute_method?(attribute)
  super || (table_exists? && column_names.include?(attribute.to_s.delete_suffix("=")))
end
```

trails has only the ActiveModel halves — the instance-level
`attribute_method?` (`activemodel/lib/active_model/attribute_methods.rb:499`,
ported as `isAttributeMethod` in
`packages/activemodel/src/attribute-methods.ts:500`) and the
`Validations::ClassMethods#attribute_method?` twin
(`packages/activemodel/src/validations.ts:271`). Neither strips the trailing
`=`, and neither consults `column_names`.

Rails' test (`attribute_methods_test.rb:1269-1273`):

```ruby
test "attribute_method?" do
  assert @target.attribute_method?(:title)
  assert @target.attribute_method?(:title=)
  assert_not @target.attribute_method?(:wibble)
end
```

On `origin/main` the `:title=` arm answers `false` for both the class and the
instance receiver.

Parked in `packages/activerecord/src/attribute-methods.test.ts` with a
converged body and a `BLOCKED:` line: `attribute_method?`.

## Acceptance criteria

- [ ] `AttributeMethods::ClassMethods#attribute_method?` is ported onto the
      ActiveRecord class surface, delegating to `super` first and then the
      `tableExists() && columnNames().includes(attrName.replace(/=$/, ""))`
      arm, at the Rails name.
- [ ] The parked test is un-skipped and passes with its converged body
      unchanged.

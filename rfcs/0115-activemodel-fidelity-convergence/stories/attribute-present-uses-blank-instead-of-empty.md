---
title: "attribute-present-uses-blank-instead-of-empty"
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

`attribute_methods.rb:387-392`:

```ruby
def attribute_present?(attr_name)
  attr_name = attr_name.to_s
  attr_name = self.class.attribute_aliases[attr_name] || attr_name
  value = _read_attribute(attr_name)
  !value.nil? && !(value.respond_to?(:empty?) && value.empty?)
end
```

`packages/activerecord/src/attribute-methods.ts`'s `attributePresent` is
`!isBlank(this.readAttribute(name))`. `isBlank` is ActiveSupport's `blank?`,
which is TRUE for a whitespace-only string; Ruby's `" ".empty?` is FALSE, so
Rails reports `attribute_present?(:title)` as **true** for `title = " "` where
trails reports false. The two also differ for any value that answers `empty?`
without being blank in the ActiveSupport sense.

Found while moving this member off `ActiveModel::Model` in #6846 (the trails
`Model` copy had the same whitespace divergence); the move did not change the
behaviour, so it is filed rather than fixed there.

## Acceptance criteria

- `attributePresent` ports the Rails predicate literally: not nil, and not
  (`respond_to?(:empty?)` && `empty?`) — no `blank?`.
- It reads through `_readAttribute` after alias resolution, as Rails does, not
  through the public `readAttribute`.
- A test covers a whitespace-only string reading as present
  (`vendor/rails/activerecord/test/cases/attribute_methods_test.rb`, the
  `attribute_present?` cases).

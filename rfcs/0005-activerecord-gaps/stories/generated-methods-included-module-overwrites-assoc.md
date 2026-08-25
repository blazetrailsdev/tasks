---
title: "converge GeneratedMethodsTest#included_module_overwrites_association_methods to Rails"
status: done
updated: 2026-07-03
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4242
claim: "2026-07-03T01:09:50Z"
assignee: "generated-methods-included-module-overwrites-assoc"
blocked-by: null
---

## Context

`GeneratedMethodsTest#test_included_module_overwrites_association_methods` in Rails
(`vendor/rails/activerecord/test/cases/associations_test.rb:1601–1612`) tests that
when a module defining `comments` is included in a model that also has
`has_many :comments`, the module method wins:

```ruby
module MyModule
  def comments; :none end
end

class MyArticle < ActiveRecord::Base
  self.table_name = "articles"
  include MyModule
  has_many :comments, inverse_of: false
end

def test_included_module_overwrites_association_methods
  assert_equal :none, MyArticle.new.comments
end
```

The current trails test (`packages/activerecord/src/associations.test.ts`,
`GeneratedMethodsTest > included module overwrites association methods`) tests
something completely different — `reflectOnAssociation` returning non-null for a
`tag` belongsTo on a bespoke Post class. It does not exercise module inclusion
overriding an association method at all.

Surfaced during PR #4228 review of `GeneratedMethodsTest` convergence.

## Acceptance criteria

- [ ] Add a `MyModule` equivalent (a plain object or mixin with `comments()`)
      and a `MyArticle`-equivalent model that includes it and also has
      `hasMany("comments")`.
- [ ] Verify that calling `myArticle.comments` (or the trails equivalent) returns
      the module's value, not the association proxy.
- [ ] Test name matches Rails verbatim:
      `"included module overwrites association methods"`.
- [ ] Remove the existing bespoke reflectOnAssociation stub from that test slot.

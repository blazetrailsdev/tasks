---
title: "port-privatize-and-the-access-control-tests"
status: ready
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 32
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeMethodsTest`'s two access-control tests
(`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:1018`,
`:1028`) both go through the private `privatize(method_signature)` helper
(:1597), which `class_eval`s a **private** instance method onto `@target`:

```ruby
def privatize(method_signature)
  @target.class_eval(<<-private_method, __FILE__, __LINE__ + 1)
    private
    def #{method_signature}
      "I'm private"
    end
  private_method
end
```

What the two tests exercise is Ruby method privacy, end to end:

- `attribute predicates respect access control` (:1018) — a private `title?`
  makes `respond_to?(:title?)` false, a public call raise `NoMethodError`
  whose message includes `"private method"`, and `send(:title?)` still answer.
  It also depends on `instance_method_already_implemented?` seeing the private
  method, so the generated predicate does not overwrite it.
- `bulk updates respect access control` (:1028) — a private `title=` makes
  `@target.new(title: ...)` and `attributes=` raise
  `ActiveRecord::UnknownAttributeError`, because `_assign_attributes` dispatches
  on the PUBLIC `respond_to?`.

trails has no runtime privacy model for instance methods: a method is on the
prototype or it is not. `respondTo`
(`packages/activemodel/src/attribute-methods.ts:461`) takes
`includePrivateMethods` and voids it; nothing consults a private-method set,
and there is no way to `class_eval` a private method onto a class at test time.
So both tests are still `makeModel()`-shaped placeholders in
`packages/activerecord/src/attribute-methods.test.ts`, left behind by
`converge-attribute-methods-test-remaining-makemodel` (which converged the
CPK `id_value`, prefix/suffix/affix and `new_topic_like_ar_class` groups).

## Acceptance criteria

- [ ] trails carries whatever privacy model these two tests need — a
      private-instance-method set consulted by `respondTo`,
      `isInstanceMethodAlreadyImplemented`, and mass assignment — or the story
      is blocked with the specific TypeScript shortcoming.
- [ ] `privatize` is ported as Rails has it (attribute_methods_test.rb:1597).
- [ ] Both tests assert their Rails counterparts' assertions, `makeModel()`
      is not used by either, and the AR suite is green on all three lanes.

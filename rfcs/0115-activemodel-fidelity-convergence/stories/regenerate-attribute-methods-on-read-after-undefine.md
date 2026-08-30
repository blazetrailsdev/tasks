---
title: "regenerate-attribute-methods-on-read-after-undefine"
status: claimed
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 33
pr: null
claim: "2026-08-30T11:55:50Z"
assignee: "converge-ar-dirty-test-off-the-rec-alias"
blocked-by: null
closed-reason: null
---

## Context

`#undefine_attribute_methods undefines alias attribute methods`
(`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:1098`) has
five arms, and the middle three turn on Ruby `method_missing`:

```ruby
topic_class.undefine_attribute_methods
assert_equal false, topic_class.method_defined?(:subject_to_be_undefined)

topic.subject_to_be_undefined                       # regenerates via method_missing
assert_equal true, topic_class.method_defined?(:subject_to_be_undefined)

topic_class.undefine_attribute_methods
assert_equal true, topic.respond_to?(:subject_to_be_undefined)
assert_equal true, topic_class.method_defined?(:subject_to_be_undefined)
```

trails generates attribute methods from `Core#init_internals`
(`packages/activerecord/src/core.ts:614`) at construction time and has no
per-record `method_missing`, so a read off an ALREADY-constructed record
regenerates nothing. Measured on this branch: after
`undefineAttributeMethods()`, `topic.subject_to_be_undefined` is `undefined`,
`"subject_to_be_undefined" in topicClass.prototype` stays `false`, and
`topic.respondTo("subject_to_be_undefined")` is `false` — arms 3, 4 and 5 all
fail. Arms 1 and 2 pass.

Closing this needs the regeneration-on-read gap closed, not a reworded
assertion, so the test is still a `makeModel()`-shaped placeholder in
`packages/activerecord/src/attribute-methods.test.ts` after
`converge-attribute-methods-test-remaining-makemodel`.

## Acceptance criteria

- [ ] Reading an undefined generated/alias attribute method off an existing
      record regenerates it, as Ruby's `method_missing` does — or the story is
      blocked with the specific TypeScript shortcoming.
- [ ] The test asserts all five of its Rails counterpart's arms and does not
      use `makeModel()`.
- [ ] AR suite green on all three lanes.

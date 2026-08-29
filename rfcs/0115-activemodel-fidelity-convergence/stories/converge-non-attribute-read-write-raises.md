---
title: "converge-non-attribute-read-write-raises"
status: claimed
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 21
pr: null
claim: "2026-08-29T11:48:53Z"
assignee: "converge-non-attribute-read-write-raises"
blocked-by: null
closed-reason: null
---

## Context

Rails' `non-attribute read and write`
(`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:641-645`)
asserts three things about an undefined name on a record:

```ruby
topic = Topic.new
assert_not_respond_to topic, "mumbo"
assert_raise(NoMethodError) { topic.mumbo }
assert_raise(NoMethodError) { topic.mumbo = 5 }
```

trails ports only the first: `packages/activerecord/src/attribute-methods.test.ts`
asserts `expect("mumbo" in topic).toBe(false)`. Measured on this branch, a
`CanonicalTopic` instance returns `undefined` for `topic.mumbo` and accepts
`topic.mumbo = 5` silently — plain JS property access, because a record is not
a `Proxy` and there is no `method_missing` trap for names that are neither
attributes nor declared methods.

Rails reaches `NoMethodError` through `BasicObject#method_missing`; the JS
analogue would be a `Proxy` `get`/`set` trap on every record instance, which is
a decision about `Base`'s construction, not about this test.

## Acceptance criteria

- [ ] A record raises for a read and a write of a name that is neither an
      attribute, an alias, nor a defined method — or the story is blocked with
      the specific reason a record cannot be proxied.
- [ ] `non-attribute read and write` ports all three Rails assertions.
- [ ] AR suite green on all three lanes.

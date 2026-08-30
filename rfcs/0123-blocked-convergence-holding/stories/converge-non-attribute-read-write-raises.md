---
title: "converge-non-attribute-read-write-raises"
status: blocked
updated: 2026-08-30
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 21
pr: 7208
claim: "2026-08-29T11:48:53Z"
assignee: "converge-non-attribute-read-write-raises"
blocked-by: "NOT delivered by #7208 — the post-merge skill marked this done by falling back to the branch name; #7208 carried no Closes-story trailer by design. Both halves are enforced at COMPILE time by #7222, which removed `[key: string]: unknown` from ActiveModel::Model. What stays unported is the RUNTIME raise Rails asserts in attribute_methods_test.rb:641-645 — assert_raise(NoMethodError) { topic.mumbo } and { topic.mumbo = 5 } — which an `as any` cast or a plain-JS caller still evades. Converged shape: Model's constructor returns a Proxy standing in for `self` (identity must be the object callers hold, or errors.base / association.owner / has_secure_password's ivars land on a second object). Blocker is cost, measured best-of-5 over 200k iterations in #7208: a get trap is 3.7x on an attribute read and 64x on an internal _field read (a proxied object defeats the inlining those reads get), a set trap 1.5x on a write and 1.7x on construction, on every ActiveModel instance. Reviving it needs a cheaper mechanism, not a re-argument."
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

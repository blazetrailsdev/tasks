---
title: "register-the-query-suffix-pattern-at-its-included-do"
status: closed
updated: 2026-08-28
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
closed-reason: "shipped in #7170 — the Query include's included do now registers the ? pattern"
---

## Context

`ActiveRecord::AttributeMethods::Query`'s `included do` block registers the
query suffix pattern
(`vendor/rails/activerecord/lib/active_record/attribute_methods/query.rb:9-11`):

```ruby
included do
  attribute_method_suffix "?", parameters: false
end
```

trails registers no `"?"` suffix anywhere — `grep attributeMethodSuffix` finds
only Write's `"="`, BeforeTypeCast's three, and Dirty's two. So no generated
`name?` method exists, even though
`packages/activerecord/src/attribute-methods/primary-key.ts:296-304` already
lists `"id?"` in `ID_ATTRIBUTE_METHODS` as "the name
`define_attribute_method_pattern` builds from the `=` and `?` suffix patterns" —
i.e. the guard is written for a pattern that is not there.

Surfaced while giving the attribute-methods seats real `include()` calls
(`give-the-remaining-attribute-methods-seats-real-include-calls`). That story
gave `Query` a module object at `packages/activerecord/src/attribute-methods/query.ts`
and a real `include(Base, _Query)` at the attribute_methods.rb:16 seat in
`packages/activerecord/src/base.ts`, but deliberately left the `included do`
hook off: registering the suffix newly generates a `name?` method for every
attribute on every model, which is a behavioural change (dangerous-attribute
checks, generated-method counts, `respondTo`) well beyond that story's scope.

## Acceptance criteria

- [ ] `Query`'s module object carries an `[included]` hook issuing
      `attributeMethodSuffix("?", { parameters: false })`, mirroring
      query.rb:9-11, in Rails' include order (after BeforeTypeCast's suffixes,
      before PrimaryKey's).
- [ ] A generated `name?` method exists for each attribute and dispatches to
      `_queryAttribute` via the pattern proxy, the way `name=` dispatches to
      `attribute=`.
- [ ] `ID_ATTRIBUTE_METHODS`' `"id?"` entry is live rather than inert.
- [ ] The call-site comment at the attribute_methods.rb:16 seat in `base.ts`
      pointing at this story is removed.
- [ ] activerecord suite green on all three adapter lanes.

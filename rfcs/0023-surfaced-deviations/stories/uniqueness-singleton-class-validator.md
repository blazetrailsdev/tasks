---
title: "Per-instance / singleton_class validator support (uniqueness singleton test)"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converting `validations/uniqueness-validation.test.ts` to the
canonical schema (RFC 0019 story `validations-uniqueness`, PR #4196).

Rails' `test_validate_uniqueness_with_singleton_class`
(`vendor/rails/activerecord/test/cases/validations/uniqueness_validation_test.rb:109-117`)
adds a validator to a single object's metaclass:

    t2 = Topic.new(title: "abc")
    t2.singleton_class.validates(:title, uniqueness: true)
    assert_not_predicate t2, :valid?
    t3 = Topic.new(title: "abc")
    assert_predicate t3, :valid?   # other instances unaffected

trails has no Ruby `singleton_class` / per-object metaclass and no per-instance
validator registration — validators live on the class and apply to every
instance. The converted test therefore exercises only the faithful observable
subset (a class-level validator rejects the duplicate `t2`) and cannot assert
`t3` remains valid, because a class-level validator necessarily affects all
instances.

## Deviation

No per-instance / singleton-class validator support. Any `record.singleton_class
.validates(...)` pattern (or equivalent per-object validation) cannot be
expressed; tests that rely on a validator scoped to one object and on sibling
instances being unaffected cannot be ported 1:1.

## Acceptance criteria

- [ ] Decide whether trails should support per-instance validation (a
      singleton-class equivalent) or formally ratify the gap.
- [ ] If supported: a validator added to one record does not affect sibling
      instances of the same class; port the `singleton_class` assertion
      (`t2` invalid, `t3` valid) verbatim.
- [ ] If ratified: document the limitation and keep the adapted class-level
      assertion, with a tracked note in the test.

## Notes

Low priority — single test, niche Ruby metaprogramming feature. Everything else
the uniqueness port surfaced (serialized-column bind, STI finder class,
association-attribute uniqueness, nil `IS NULL`, UnknownPrimaryKey raise,
allow_nil/allow_blank, clearValidatorsBang async reset) was converged in PR #4196.

---
title: "d2-has-one-assignment-before-child-saved"
status: in-progress
updated: 2026-07-09
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4830
claim: "2026-07-09T12:49:38Z"
assignee: "d2-has-one-assignment-before-child-saved"
blocked-by: null
closed-reason: null
---

## Context

Split out of `d2-has-one-misc-gaps` (RFC 0005-activerecord-gaps). The four other
misc has_one singles in
`packages/activerecord/src/associations/has-one-associations.test.ts` are now
un-skipped and passing; this one remains blocked on a JS-language limitation.

The test `test_assignment_before_child_saved`
(vendor/rails/activerecord/test/cases/associations/has_one_associations_test.rb:468):

```ruby
firm = Firm.find(1)
firm.account = a = Account.new("credit_limit" => 1000)
assert_predicate a, :persisted?   # <-- immediate persist on assignment
assert_equal a, firm.account
firm.association(:account).reload
assert_equal a, firm.account
```

Rails' `HasOneAssociation#replace` persists the child _synchronously_ on
assignment to a saved owner. In trails the JS property setter
(`packages/activerecord/src/associations/builder/has-one.ts:54` → `queueWrite`)
cannot `await`, so it defers persistence to the owner's next `save()` and
`a.persisted?` is `false` immediately after `firm.account = a`. The awaitable
`HasOneAssociation#writer` → `persistImmediate` path
(`has-one-association.ts:105`) already does the Rails-faithful immediate persist,
but the bare `=` setter can't reach it without awaiting.

## Acceptance criteria

- [ ] Decide the convergence path for immediate-persist-on-assignment given the
      non-awaitable JS setter (e.g. an awaitable assignment helper, or accept the
      documented deviation with a trails-named test), and land it.
- [ ] `assignment before child saved` un-skipped with the verbatim Rails name (or
      converted to a documented trails deviation test per the decision), test:compare
      delta non-negative.

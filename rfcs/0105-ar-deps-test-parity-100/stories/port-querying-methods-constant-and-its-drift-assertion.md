---
title: "Port Querying::QUERYING_METHODS and the delegation test's equality assertion that guards it"
status: draft
updated: 2026-09-12
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares the delegate list as a public constant and then asserts, in its own test, that the
test's copy of the list is identical to it. trails ports neither, and a name drifted into the
trails copy as a result.

`activerecord/lib/active_record/querying.rb:5-22` declares
`ActiveRecord::Querying::QUERYING_METHODS` — a frozen array of 90-odd symbols — and line 23 is
`delegate(*QUERYING_METHODS, to: :all)`. `activerecord/test/cases/relation/delegation_test.rb:58`
derives its own list from `Relation.public_instance_methods(false)` and line 79 then asserts:

```ruby
assert_equal QUERYING_METHODS.sort, ActiveRecord::Querying::QUERYING_METHODS.sort
```

That assertion is the guard: the test list and the shipped constant cannot drift apart.

In trails, `packages/activerecord/src/querying.ts` has no `QUERYING_METHODS` constant at all —
each delegate is hand-written as its own exported function — and
`packages/activerecord/src/relation/delegation.test.ts:60` carries a hand-maintained array with
no equality assertion against anything.

It had already drifted. `isEmpty` sat in the test array although `querying.rb:5-22` contains no
`empty?`; Rails excludes it because `delegation_test.rb:64` rejects names ending in `?` and
`empty?` is never re-added by hand at `:9` the way `exists?`, `any?`, `many?`, `none?` and `one?`
are. trails spells the name `isEmpty`, so the `?` rejection does not transfer and nothing caught
it. trails#7730 removed the stale entry by hand; the assertion that would have caught it is still
missing.

## Converged shape

- `querying.ts` exports `QUERYING_METHODS`, the camelCased port of `querying.rb:5-22` in Rails'
  order, as a frozen readonly array.
- `delegation.test.ts` keeps its derived list (that half mirrors `delegation_test.rb:58-77`) and
  gains the `:79` equality assertion against the new constant, under the Rails test name
  `test_delegate_querying_methods` already used there.
- The constant is the single source of truth for the list; if the hand-written delegate functions
  can be generated from or checked against it, say so in the PR rather than expanding scope here.

Check as you go whether any other name in the trails array has no counterpart in
`querying.rb:5-22` — `isEmpty` was found by deleting a method, not by looking, so the list has
never actually been diffed against Rails'.

## Acceptance criteria

- `QUERYING_METHODS` is exported from `packages/activerecord/src/querying.ts` and matches
  `querying.rb:5-22` name-for-name under the conventions in `docs/ruby-ts-conventions.md`.
- `delegation.test.ts` asserts its derived list equals that constant, and the assertion fails if
  either side gains a name the other lacks.
- `pnpm parity:api` credits the constant (it is Rails surface, so it should raise the matched
  count, not the extra-surface one); `pnpm parity:api:extra --package activerecord` gains no row.
- `pnpm parity:test` delta is non-negative.

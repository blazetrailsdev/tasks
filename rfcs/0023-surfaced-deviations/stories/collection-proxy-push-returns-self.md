---
title: "CollectionProxy#push should return self (the collection), not void"
status: ready
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `CollectionProxy#<<` / `push` / `append` / `concat` return `self` (the
collection proxy), enabling chaining:

```ruby
tags = posts(:thinking).tags
assert_equal tags, posts(:thinking).tags.push(tags(:general))
```

trails' `CollectionProxy#push` returns `Promise<void>`, so the chaining pattern
fails. Surfaced when porting `test_adding_to_has_many_through_should_return_self`
in `associations/join-model.test.ts` (wave 5, PR #3617) — test is currently
`it.skip`'d there.

Rails source: `activerecord/lib/active_record/associations/collection_proxy.rb`
`#<<` delegates to `CollectionAssociation#concat` which returns `self`.

## Acceptance criteria

- [ ] `CollectionProxy#push` (and `<<` / `concat` / `append`) returns the proxy
      instance (typed as `this`) after awaiting the DB writes.
- [ ] `test_adding_to_has_many_through_should_return_self` in
      `associations/join-model.test.ts` un-skipped and passing.
- [ ] No regressions in existing push/concat call sites (they discard the return value today).

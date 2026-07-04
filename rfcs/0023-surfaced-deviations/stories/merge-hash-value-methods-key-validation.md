---
title: "merge-hash-value-methods-key-validation"
status: claimed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-04T17:49:27Z"
assignee: "merge-hash-value-methods-key-validation"
blocked-by: null
---

## Context

trails `Relation#merge(Hash)` treats the hash as `where` conditions:
`merger.ts` `HashMerger#merge` is just `this.relation.where(this.hash)`, and the
constructor validates nothing. Rails' `Relation::HashMerger#initialize`
(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:7-12`) does:

```ruby
def initialize(relation, hash)
  hash.assert_valid_keys(*Relation::VALUE_METHODS)
  @relation = relation
  @hash     = hash
end
```

so `merge(omg: "lol")` raises `ArgumentError`, and a valid `merge(where: {...},
readonly: true)` dispatches each key to the matching value-method. trails' hash
merge is therefore both semantically different (column predicates vs
value-methods) and unvalidated.

Surfaced by porting `relation_test.rb`'s `merging a hash with unknown keys
raises` (relation_test.rb:164-166) in PR #4192, committed as `it.fails` in
`packages/activerecord/src/relation.test.ts`.

## Acceptance criteria

- [ ] `Relation#merge(Hash)` mirrors Rails `HashMerger` — keys are
      `Relation::VALUE_METHODS`, validated via `assert_valid_keys`, raising
      `ArgumentError` on unknown keys.
- [ ] Remove the `it.fails` marker on `merging a hash with unknown keys raises`
      (and any sibling hash-merge tests) once it passes.
- [ ] No regression in existing `merge` tests.

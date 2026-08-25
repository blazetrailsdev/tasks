---
title: "replace's persisted guard adds a wasLoaded disjunct Rails has no counterpart for"
status: draft
updated: 2026-08-14
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#replace` guards the persisted-owner half on an
array comparison against the loaded baseline
(`activerecord/lib/active_record/associations/collection_association.rb:248-254`):

```ruby
replace_common_records_in_memory(other_array, original_target)
if other_array != original_target
  transaction { replace_records(other_array, original_target) }
else
  other_array
end
```

trails' persisted arm
(`packages/activerecord/src/associations/collection-association.ts`, the `else`
branch of `replace`) spells that guard as:

```ts
if (!wasLoaded || !arraysEqual(otherArray, originalTarget)) {
```

Two divergences in one line:

1. **The `!wasLoaded` disjunct has no Rails counterpart.** Rails has no
   `was_loaded` notion here at all — it does not need one, because its
   `original_target` came from `load_target` two lines earlier and is therefore
   always the real baseline. trails needs the extra arm only because its
   `original_target` is the possibly-empty in-memory target (see
   `collection-association-replace-missing-skip-strict-loading`). It is a
   symptom of that gap, not an independent decision.
2. **`arraysEqual` vs Ruby `!=`.** Ruby's `Array#!=` compares element-wise with
   `==`, which for an AR model is `class + id` (`activerecord/lib/active_record/core.rb`
   `#==`), so two distinct instances of the same persisted row compare EQUAL and
   Rails takes the no-op `else`. Whether `arraysEqual` matches that, or falls
   back to identity, decides whether an assignment of freshly-loaded equivalent
   records is a no-op or a full diff + transaction.

PR #6506 converged the new-owner arm but deliberately left this one untouched.

## Converged shape

The persisted arm reads `if (!arraysEqual(otherArray, originalTarget))` — Rails'
single condition, no `wasLoaded` disjunct — with `arraysEqual` pinned to Ruby
`Array#==` semantics (element-wise AR `==`, i.e. class + id) by a test that
assigns a distinct-but-equal instance set and asserts NO deletes or inserts are
issued. Depends on `original_target` actually being the loaded baseline, so it
lands with (or after) the `skip_strict_loading` story.

## Acceptance criteria

- [ ] The `!wasLoaded` disjunct is gone; the guard is Rails' `other_array !=
original_target` alone.
- [ ] A test pins the Ruby `==` semantics: reassigning an equal-by-id but
      distinct-by-identity set issues no DB work.
- [ ] `pnpm parity:api:calls` / `:args` green, no new baseline row.

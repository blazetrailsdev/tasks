---
title: "Nested-hash recursion re-runs convertDotNotationToHash; Rails' expand_from_hash recurses raw"
status: claimed
updated: 2026-07-23
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-23T14:07:36Z"
assignee: "nested-hash-recursion-renormalizes-dot-notation"
blocked-by: null
closed-reason: null
---

## Context

Rails' `expand_from_hash` nested-hash branch recurses WITHOUT re-normalizing:
`table.associated_table(key, &block).predicate_builder.expand_from_hash(value.stringify_keys)`
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:99-101`).
`convert_dot_notation_to_hash` runs exactly once, at the `build_from_hash` entry
(predicate_builder.rb:23-26).

trails' `buildFromHashInternal` nested branch
(`packages/activerecord/src/relation/predicate-builder.ts` — the
`isPlainObject(value) && !hasColumn(key)` arm) instead recurses through the
associated builder's public `buildFromHash`/`buildNegatedFromHash`, which run
`convertDotNotationToHash` AGAIN on the nested hash. Divergent observable:
`where(posts: { "comments.body": v })` — Rails treats `"comments.body"` as a
literal column name on the posts table (`arel_table["comments.body"]`); trails
re-splits it into a second association hop. Also structural: Rails'
`expand_from_hash` is a distinct protected method (api:compare target); trails
collapses it into `buildFromHashInternal` plus a vestigial `expandFromHash` stub
that ignores `negated`.

## Acceptance criteria

- [ ] Nested recursion calls the associated builder's `expandFromHash`
      equivalent directly — `convertDotNotationToHash` runs once per
      `buildFromHash` entry, matching predicate_builder.rb:23-26/99-101.
- [ ] The vestigial `expandFromHash` stub either becomes the real recursion
      target or is deleted.
- [ ] No test name changes; test:compare / api:compare delta non-negative.

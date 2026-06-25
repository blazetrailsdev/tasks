---
title: "merge-eager-load-association-target"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Merging a relation built with `eagerLoad(:lastComment)` into another Post
relation does not carry the eager hasOne target through to the merged result;
reading `post.lastComment` on a row from the merged relation returns undefined.

Surfaced by the faithful port of `relation/merging_test.rb`
(`test_relation_merging_with_eager_load`), `it.skip` in
packages/activerecord/src/relation/merging.test.ts with this slug.

Impl: packages/activerecord/src/relation/merger.ts (mergePreloads /
eager-load) + relation eager-load materialization. Rails ref:
vendor/rails/activerecord/lib/active_record/relation/merger.rb.

## Acceptance criteria

- [ ] `merge(eagerLoad("lastComment"))` carries the eager association so the
      merged rows expose the loaded `lastComment`.
- [ ] Un-skip "relation merging with eager load"; it passes for both orderings.

---
title: "merge-belongsto-target-in-after-save-hook"
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

The canonical `CommentThatAutomaticallyAltersPostBody` after_save hook
(packages/activerecord/src/test-helpers/models/comment.ts) does
`const post = this.post; if (post) await post.update(...)`. Under trails the
in-memory belongsTo target read in the hook is not a record instance —
`post.update` is undefined — so creating such a comment throws.

Surfaced by the faithful port of `relation/merging_test.rb`
(`test_merging_compares_symbols_and_strings_as_equal`), `it.skip` in
packages/activerecord/src/relation/merging.test.ts with this slug.

Impl: belongsTo accessor / inverse wiring so `this.<assoc>` inside a callback
yields the loaded record (or loads it). Rails ref:
vendor/rails/activerecord/test/models/comment.rb +
vendor/rails/activerecord/test/models/post.rb.

## Acceptance criteria

- [ ] `this.post` inside the after_save hook is a record exposing `update`.
- [ ] Un-skip "merging compares symbols and strings as equal"; it passes.

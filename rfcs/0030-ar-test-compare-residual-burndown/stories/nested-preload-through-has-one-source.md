---
title: "nested-preload-through-has-one-source"
status: in-progress
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4609
claim: "2026-07-05T13:22:26Z"
assignee: "nested-preload-through-has-one-source"
blocked-by: null
---

## Context

`preloading across has one through constrains loaded records` in
`packages/activerecord/src/associations/cascaded-eager-loading.test.ts` is
`it.skip`. The `resetCallbacks` API it originally needed now exists (landed in
story cascaded-eager-join-alias-and-callbacks), but the test surfaces a SECOND,
independent gap: a nested `preload` through a `has_one :through` does not
instantiate the nested association.

ROOT CAUSE: `Author.where(id:).preload(recent_response: :author)` loads
`recent_response` (a `has_one :through recent_post, source: :comments`, i.e. the
ordered first comment), but the nested `:author` on that comment is never
preloaded — `recentResponse.association("author").target` is undefined. The
`after_initialize` recorder therefore sees 1 Author (the base david) instead of
the expected 2 (`[david, authors(:bob)]`). Confirmed via debug: the
recent_response target loads (Comment id 15), but its `author` child does not.

The `has one constrains` sibling test (non-through `has_one`,
`preload(recent_post: :comments)`) passes, so the gap is specific to nesting
preloads under a `has_one :through` source.

## Acceptance criteria

- [ ] Nested `preload(has_one_through: :nested_assoc)` instantiates the nested
      association on the through target.
- [ ] Un-skip `preloading across has one through constrains loaded records`
      (asserts the after_initialize recorder sees exactly `[author, authors(:bob)]`).

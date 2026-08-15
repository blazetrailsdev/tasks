---
title: "naming-shared-vs-isolated-namespace"
status: done
updated: 2026-08-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6572
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Name#initialize` (naming.rb:166-185) distinguishes two shapes:

- `Name.new(Blog::Post)` — namespace is part of the constant name only:
  `param_key == "blog_post"`, `route_key == "blog_posts"`.
- `Name.new(Blog::Post, Blog)` — an isolated namespace:
  `@unnamespaced = @name.delete_prefix("Blog::")`, so
  `param_key == "post"`, `route_key == "posts"`.

trails' `ModelName` (`packages/activemodel/src/naming.ts:245-360`) takes the
namespace segments as its second argument and always produces the _isolated_
shape, so the shared shape cannot be expressed at all. The comment at
`naming.ts:113-116` ratifies this; it is debt, not a decision.

Two consequences, both live:

- `naming.test.ts` `NamingTest › route key` / `param key` assert
  `"track_backs"` / `"track_back"` where Rails' `NamingTest` (which builds
  `ActiveModel::Name.new(Post::TrackBack)` with no namespace argument) asserts
  `"post_track_backs"` / `"post_track_back"`. Both carry a call-site comment
  pointing here.
- `NamingWithNamespacedModelInSharedNamespaceTest` asserts `"posts"` /
  `"post"` where Rails asserts `"blog_posts"` / `"blog_post"`
  (`vendor/rails/activemodel/test/cases/naming_test.rb:87-125`), and the
  describe carries a comment claiming the shared shape is "purely an artifact
  of Ruby constant-name strings" — it is not, it is a distinct Rails output.

## Acceptance criteria

- `ModelName` can express both the shared and the isolated shape, deriving
  `paramKey` / `routeKey` / `singularRouteKey` the way naming.rb:180-184 does.
- `naming.test.ts` asserts Rails' literal values in `NamingTest` and in
  `NamingWithNamespacedModelInSharedNamespaceTest`; the deviation comments are
  deleted, not reworded.
- `pnpm parity:test -- --assertions --package activemodel` shows no new
  mismatches and the mark is lowered accordingly.

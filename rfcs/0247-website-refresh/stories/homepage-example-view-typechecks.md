---
title: "Homepage example show.html.tse typechecks (attached/rich-text readers reach Post)"
status: claimed
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-23T02:54:24Z"
assignee: "check-hero-runs-on-example-and-compiler-changes"
blocked-by: null
closed-reason: null
---

## Context

The home page shows `examples/homepage/app/views/posts/show.html.tse` as the "Views are typed templates" block, but that view does not typecheck. Running `trails-tsc-views build --views app/views --out gen` and then `tsc --noEmit` over `app` plus `gen/views` (the same steps as `examples/homepage/scripts/check-hero.mjs`, with no edits applied) reports:

- `show.html.tse(4,…)`: TS2339 Property 'coverImage' does not exist on type 'Post'
- `show.html.tse(5,…)`: TS2339 Property 'body' does not exist on type 'Post'

`Post` (`examples/homepage/app/models/post.ts`) calls `hasOneAttached("coverImage")` and `hasRichText("body")`. Rails defines the readers in `activestorage/lib/active_storage/attached/model.rb` (`has_one_attached`, its `def #{name}` reader) and `actiontext/lib/action_text/attribute.rb` (`has_rich_text`, its `def #{name}` reader). The class methods became typed in trails#10561 (`engine-installed-base-class-methods-are-untyped`), but the instance readers they generate do not reach the model's type, so a view reading `post.coverImage` fails.

## Acceptance criteria

- The unedited `examples/homepage` views typecheck: `trails-tsc-views build` followed by `tsc` reports no errors.
- `check:hero` (or a sibling step in the CI Website job) also runs the unedited compile and fails on any error, so the page never shows a view that doesn't compile.
- The fix types the generated readers at their definers (Active Storage / Action Text). It does not add `declare` members to the example.

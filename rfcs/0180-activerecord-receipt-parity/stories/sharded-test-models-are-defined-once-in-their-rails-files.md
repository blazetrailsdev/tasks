---
title: "sharded-test-models-are-defined-once-in-their-rails-files"
status: in-progress
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8711
claim: "2026-10-09T14:17:56Z"
assignee: "pg-lookup-cast-type-from-column-floats-its-verify"
blocked-by: null
closed-reason: null
---

## Context

Rails lays the sharded test models out one class per file, `vendor/rails/v8.0.2/activerecord/test/models/sharded/{blog,blog_post,blog_post_with_revision,comment,tag,blog_post_tag,blog_post_destroy_async,comment_destroy_async}.rb`, and `test/models/sharded.rb` is only a `require_relative` list of the first six.

trails has both shapes. `packages/activerecord/src/test-helpers/models/sharded/*.ts` mirrors the per-class files and is what `pnpm models:compare` matches against Rails (deleting the directory reds the `Rails API/Test Comparison` job with `missing=8`, seen on trails#8701), but nothing imports those files and their classes are not seated as constants. `test-helpers/models/sharded.ts` re-declares six of the classes inline (`ShardedBlog`, `ShardedBlogPost`, `ShardedBlogPostWithRevision`, `ShardedComment`, `ShardedTag`, `ShardedBlogPostTag`), seats them with `registerConstant`, and is the module every test imports. So each class exists twice with two identities, and the copy that parity scores is not the copy that runs.

## Acceptance criteria

- [ ] Each class is defined once, in its `sharded/<name>.ts` file, and seated there as Rails' `Sharded::<Name>` constant.
- [ ] `sharded.ts` only imports the six files `sharded.rb` requires and re-exports nothing Rails does not.
- [ ] Tests that imported the classes from `sharded.ts` resolve the single definition.
- [ ] `pnpm models:compare` stays at zero missing and zero diff for the eight files.

---
title: "collection-proxy-extend-super-chain"
status: claimed
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: "2026-09-22T17:58:00Z"
assignee: "collection-proxy-extend-super-chain"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#initialize` (`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:32-38`)
runs `extend(*extensions)`. Ruby's `extend(A, B)` puts A above B in the lookup chain, so a method in A can
call `super` and reach B. The model `Post::NamedExtension#greeting` is `super + " :)"`
(`vendor/rails/activerecord/test/models/post.rb:16-30`). On `comments_with_extend_2`
(`extend: [NamedExtension, NamedExtension2]`) the result is `"hullo :)"`.

trails' `CollectionProxy` constructor (`packages/activerecord/src/associations/collection-proxy.ts:198-211`)
copies each extension's functions onto the instance in order. The last one wins and nothing can call `super`.
The trails `Post.namedExtension.greeting` (`packages/activerecord/src/test-helpers/models/post.ts:150-162`) returns a
hardcoded `"hello :)"` to cover for this. The model also leaves out the `has_many :comments_with_extend ... do def greeting; "hello"; end end`
block extension (`post.rb:94-98`).

## Acceptance criteria

- `CollectionProxy` applies extensions the way Ruby's `extend(*extensions)` does: the first module sits highest, and `super` reaches the next module and then the proxy.
- `Post.namedExtension.greeting` is `super + " :)"` and `commentsWithExtend` has the Rails block extension defining `greeting` as `"hello"`.
- Un-skip `association with extend option with multiple extensions` and `extend option affects per association`
  in `packages/activerecord/src/associations/has-many-associations.test.ts`.

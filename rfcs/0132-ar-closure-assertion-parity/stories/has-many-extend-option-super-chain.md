---
title: "has-many-extend-option-super-chain"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy`'s constructor (`packages/activerecord/src/associations/collection-proxy.ts:198-211`) copies each `extend:` module's methods onto the proxy flat (`this[name] = fn.bind(this)`), so the last module wins and a method cannot `super` into the next extension. Rails extends the relation with each module (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb` `extending!`), so Ruby method lookup chains them: `Post::NamedExtension#greeting` is `super + " :)"` (`vendor/rails/activerecord/test/models/post.rb:16-30`), and `comments_with_extend_2` (`extend: [NamedExtension, NamedExtension2]`) answers `"hullo :)"`.

The trails model hardcodes `greeting` to `"hello :)"` (`packages/activerecord/src/test-helpers/models/post.ts:150-163`) instead of calling super.

## Acceptance criteria

- Extensions compose as a prototype chain so an extension method can call the next one's (the super analogue); `Post.namedExtension.greeting` mirrors `super + " :)"`.
- Un-skip `association with extend option with multiple extensions` and `extend option affects per association` in `has-many-associations.test.ts` (has_many_associations_test.rb:2784-2796).

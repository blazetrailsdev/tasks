---
title: "association-extend-option-super-chain"
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

`vendor/rails/activerecord/test/models/post.rb:16-30` defines `NamedExtension#greeting` as
`super + " :)"` and `NamedExtension2#greeting` as `"hullo"`; `has_many :comments_with_extend_2,
extend: [NamedExtension, NamedExtension2]` (post.rb:102) relies on Ruby `extend(A, B)` giving `A`
priority with `super` reaching `B`, so `greeting` is `"hullo :)"`. `comments_with_extend` (post.rb:94)
also carries a block extension defining `greeting` as `"hello"`, which `NamedExtension` wraps.

trails hardcodes `Post.namedExtension.greeting` as `"hello :)"`
(`packages/activerecord/src/test-helpers/models/post.ts`), and `extendingBang`
(`packages/activerecord/src/relation/query-methods.ts`) binds each module's functions onto the
relation in order with no `super` chain, so the last module wins.

Parked (it.skip) in `has-many-associations.test.ts` by
has-many-associations-test-fixture-accessor-convergence:

- `association with extend option with multiple extensions` (rb:2784)
- `extend option affects per association` (rb:2790)

## Acceptance criteria

- Extension modules applied through `extend:` / `extending` resolve with Ruby `extend` priority
  (first module wins) and a module method can reach the next one's implementation as `super`.
- `Post`'s `NamedExtension` / `NamedExtension2` / block extension mirror post.rb:16-30,94-102.
- Both tests above are un-skipped and pass.

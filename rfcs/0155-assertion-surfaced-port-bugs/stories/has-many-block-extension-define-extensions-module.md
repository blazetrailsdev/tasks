---
title: "has_many block extension builds a real extension module (define_extensions)"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8073
claim: "2026-09-25T00:44:14Z"
assignee: "datetime-attribute-rejects-ruby-datetime-values"
blocked-by: null
closed-reason: null
---

## Context

Rails `Builder::CollectionAssociation.define_extensions`
(`activerecord/lib/active_record/associations/builder/collection_association.rb:20-27`) turns a
`has_many ... do ... end` block into a real module
(`model.const_set(extension_module_name, Module.new(&block_extension))`), and
`Builder::Association.build` (`builder/association.rb`) appends it to `options[:extend]`.

In trails, `defineExtensions` (`packages/activerecord/src/associations/builder/collection-association.ts:34-42`)
stores `{ name, block }` rather than a module of methods, and `hasMany` has no way to pass a
block. `Post#comments_with_extend` (`vendor/rails/activerecord/test/models/post.rb:94-98`) is
therefore ported with its block extension hand-written as
`Post.CommentsWithExtendAssociationExtension` in `extend:` (`test-helpers/models/post.ts`).

## Acceptance criteria

- The has_many / habtm macros accept the block extension and `defineExtensions` builds a method
  module under `<Name>AssociationExtension` on the model, appended to `options.extend`.
- `Post`'s `commentsWithExtend` declares its `greeting` through that block rather than a
  hand-listed module; the has_many extend tests (rb:2778-2796) still pass.

---
title: "inlined-from-manifest-follows-included-hook-includes"
status: claimed
updated: 2026-10-19
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-19T14:44:44Z"
assignee: "activemodel-api-attributes-core-initialize-inlined"
blocked-by: null
closed-reason: null
---

## Context

The Ruby API extractor records a class's `include`s only where they are written in the class body. A module mixed in from another module's `self.included` (`Thor::Base.included` does `base.send :include, Invocation` and `Shell`, `vendor/thor/v1.3.2/lib/thor/base.rb:116-121`; `Rails::Generators::ResourceHelpers.included` does `base.include(ModelHelpers)`, `vendor/rails/v8.0.2/railties/lib/rails/generators/resource_helpers.rb:11-15`), or one prepended by a load hook (`EncryptedFixtures` onto `Fixture`, `activerecord/lib/active_record/railtie.rb:357-362`), is missing from the class's ancestry. So `pnpm parity:api:inlined` rejects an `@inlinedFrom` tag for those segments ("names a module … does not include or prepend"), even though they are inlined in `Thor`, `Thor::Group`, the scaffold generators and `Fixture` (trails#9059). The same gap makes the call gate compare `Group`'s constructor against `Base#initialize` alone, so its `order:constructor,classOptions` row is baselined against this story. Separately, `thor.rb`'s `class Thor` maps to no TS constructor, so `thor.ts` takes no tag at all.

## Acceptance criteria

- The extractor follows `included` / `self.included` bodies that `include` / `send :include` a module, and the inlined gate accepts and then requires the Invocation, Shell and ModelHelpers tags on those constructors.
- `Thor` in `thor.ts` pairs with `thor.rb`'s `Thor`.
- The `thor/group.json` order row is deleted.

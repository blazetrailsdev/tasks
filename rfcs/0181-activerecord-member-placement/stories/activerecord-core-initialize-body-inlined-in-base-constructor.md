---
title: "activerecord: Core#initialize body is inlined in Base's constructor"
status: closed
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: placement
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Blocker cleared and the work landed in trails#8439 (4c3898e0f0): core.ts carries Core#initialize as the function constructor, wrapping super via SuperMethods.superMethod(this, 'initialize') and registered with mod.defineMethod('initialize', constructor); Model's constructor reaches it through this.initialize. On origin/main babd453afa a fresh parity:api:extra --package activerecord no longer lists 'base.ts constructor inlined-from core.rb (initialize)', and base.ts carries no @missingRailsCall init_internals tag (sibling base-constructor-calls-init-internals-not-activemodel is done, same PR). The callback tail still in Base's constructor is owned by RFC 0174 drafts core-initialize-runs-initialize-internals-callback-after-assign-attributes and initialize-callbacks-are-suppressed-by-mutating-the-class."
---

## Context

`pnpm parity:api:extra --package activerecord` still reports one Core row after
`activerecord-relocate-core-bodies-inlined-in-base` moved the other twelve:

```text
activerecord/base.ts constructor inlined-from core.rb (initialize)
```

`ActiveRecord::Core#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:470-482`) is a
module method that wraps `super`: it seats `@new_record` / `@attributes`, calls
`init_internals` and `initialize_internals_callback`, calls `super` (reaching
`ActiveModel::API#initialize`, `activemodel/lib/active_model/api.rb:80-84`),
then yields the block and runs `_run_initialize_callbacks`.

In trails the body sits in `Base`'s `constructor`
(`packages/activerecord/src/base.ts`), interleaved with the port of
`Inheritance::ClassMethods#new` (`inheritance.rb:56-81`, the `new.target` STI
dispatch and the abstract-class raise). `inlinedModuleMembers`
(`scripts/api-compare/extra-surface.ts`) clears the row only when `core.ts`
carries an `[initialize]` member — ruby-compat's module-`initialize` hook
(`packages/ruby-compat/src/include.ts`, `initializeIncludedModules`).

That hook cannot hold this body. `include()` registers a module's `[initialize]`
to run where `ActiveModel::API#initialize` calls `super()`
(`packages/activemodel/src/api.ts:20-24`), which is ABOVE the API layer, after
`assign_attributes`, and with no block; `Core#initialize` sits BELOW it and
wraps it. A plain function in `core.ts` cannot call `super(...)`, and JS
forbids touching `this` before `super()` returns, so neither half of the
wrapper can be hosted outside the class body. This is the same wall the
blocked `base-constructor-calls-init-internals-not-activemodel` records for
the `init_internals` call.

## Acceptance criteria

- [ ] `core.ts` carries the body of `Core#initialize` (`core.rb:470-482`), in
      Rails' order around the `super` call, and `Base`'s constructor reaches it
      without a delegation wrapper.
- [ ] `pnpm parity:api:extra --package activerecord` no longer lists
      `base.ts constructor inlined-from core.rb (initialize)`.
- [ ] The `@missingRailsCall init_internals` tag on the constructor is resolved
      together with `base-constructor-calls-init-internals-not-activemodel`.

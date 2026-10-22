---
title: "actionview-api-residue-context-rendering-class-methods"
status: done
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9205
claim: "2026-10-22T00:48:07Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

# actionview API residue: context.rb accessors and rendering.rb ClassMethods

## Context

`actionview-api-residue-context-buffers-layouts-template` converged 13 of its 19 names (2026-10-21). Six remain (`pnpm parity:api --package actionview --missing`):

- `context.rb`'s `attr_accessor :output_buffer, :view_flow` (`vendor/rails/v8.0.2/actionview/lib/action_view/context.rb`) score `[declaration-only]`: `packages/actionview/src/context.ts` declares them only on the `Context` interface. `test_case.rb`'s accessor pairs have the same shape and the same score, so the module-`attr_accessor` credit shape is undecided repo-wide.
- `rendering.rb`'s `ClassMethods#_helpers` (`:49-50`, returns nil) is a `[declaration-only]` field on `ViewContextClassMethods`, and `ClassMethods#eager_load!` (`:76-80`, `super; view_context_class; nil`) is unported. `Rendering.ClassMethods` in `packages/actionview/src/rendering.ts` is a plain object, so its `super` into `AbstractController::Base.eagerLoadBang` (`packages/actionpack/src/abstract-controller/base.ts`) needs it to become a `Module` with `ClassMethods.superMethod`, as `action-controller/metal/flash.ts` does.

## Acceptance criteria

- `eagerLoadBang` is ported on `Rendering.ClassMethods`, calling super then `viewContextClass()`.
- `_helpers` and the four context.rb accessors are credited by a ported body, or the attr_accessor-on-module shape is decided and the comparer credits it.
- `context.rb` and `rendering.rb` show 0 missing.

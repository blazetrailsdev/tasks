---
title: "controller-runtime-and-url-for-load-hook-initializes-guarded-inline"
status: draft
updated: 2026-10-19
rfc: "0188-module-initialize-inlined-into-constructors"
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

Split from `load-hook-installed-module-initializes-and-activerecord-missing-tag-enrollment`. The repo owner ruled (2026-10-19, root CLAUDE.md § "A module's `initialize` is inlined into the constructor") that a module installed at run time is inlined behind an `isModuleIncluded(new.target, Mod)` guard. `EncryptedFixtures` converged that way in `Fixture`'s constructor.

Still open: `ActiveRecord::Railties::ControllerRuntime#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb:26-29`, `super; self.db_runtime = nil`). It is included into `ActionController::Base` by an `on_load(:action_controller)` hook in activerecord, and is still the `[initialize]` symbol hook in `packages/activerecord/src/trailties/controller-runtime.ts`, run by `initializeIncludedModules(this)` in `packages/actionpack/src/action-controller/metal.ts:142`. The guard has to name the module from actionpack, which does not depend on activerecord, so it needs a call-time seat (root § "Call-time constant resolution"). `ActionView::Base`'s `initializeIncludedModules` (UrlFor's `@_routes = nil`, `action_view/railtie.rb:100`) is the same case.

## Acceptance criteria

- `ControllerRuntime#initialize` is inlined behind the guard into the constructor of the class Rails includes it into, and its `[initialize]` hook is deleted.
- `metal.ts` and `ActionView::Base` no longer call `initializeIncludedModules`, or the PR names what still needs it.

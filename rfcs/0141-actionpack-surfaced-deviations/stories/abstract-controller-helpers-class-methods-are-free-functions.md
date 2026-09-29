---
title: "AbstractController::Helpers ClassMethods (helper, clear_helpers, _helpers_for_modification) are free functions"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Helpers::ClassMethods` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:64-225`)
defines these class methods on every class that includes `Helpers`:

- `helper_method` (`:128`)
- `helper` (`:198`)
- `clear_helpers` (`:209`)
- `_helpers_for_modification` (`:218`)

trails#8236 converged only `helperMethod`. It is now `this`-typed and seated as
`static helperMethod` on `ActionController::Base` (`packages/actionpack/src/action-controller/base.ts`).
`helper(cls, ...)`, `clearHelpers(cls)` and `_helpersForModification(cls)` are still free
functions that take the class as their first argument
(`packages/actionpack/src/abstract-controller/helpers.ts`). So `rbObjRespondTo(klass, "helper")`
cannot answer `defined?` and callers cannot write `Klass.helper(...)`.

The seat is also `ActionController::Base` rather than an `AbstractController::Helpers`
`ClassMethods` module that is `extend`ed onto the including class.

## Acceptance criteria

- `helper`, `clearHelpers` and `_helpersForModification` are `this`-typed. Call sites use
  `Klass.helper(...)`, or `helper.call(klass, ...)` inside the module.
- The four class methods live on an `AbstractController::Helpers` `ClassMethods` that is
  `extend`ed onto `ActionController::Base`, as `helpers.rb:64` does. `base.ts` no longer
  declares `static helperMethod`.

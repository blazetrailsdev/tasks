---
title: "AbstractController class attributes, helper module resolution and helpers.rb arity"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package abstractcontroller` reports 95/132. Excluding
`rendering.rb` (RFC 0161 (controller rendering)), the gap is:

- **Four class-level seats, 22 rows**, under
  `vendor/rails/v8.0.2/actionpack/lib/abstract_controller/`:
  `class_attribute :_view_cache_dependencies` (`caching.rb:44`),
  `class_attribute :fragment_cache_keys` (`caching/fragments.rb:26`),
  `mattr_accessor :raise_on_missing_callback_actions` (`callbacks.rb:36`) and
  `class_attribute :_helper_methods` (`helpers.rb:13`). Most score as
  declaration-only: trails declares them, but not through the primitive.
- **Three `Helpers::ClassMethods` methods:** `modules_for_helpers`
  (`helpers.rb:33`), `all_helpers_from_path` (`:48`) and
  `helper_modules_from_paths` (`:57`).
- **Five arity rows on `helpers.rb`:** `clear_helpers()`,
  `_helpers_for_modification()` and `default_helper_module!()` take no
  arguments in Rails; trails passes the class explicitly (`(cls)`,
  `(cls, options)`), and `modules_for_helpers` / `helper_modules_from_paths`
  carry an extra `options`. These are class methods in Rails, so `this` is the
  class.
- **Four call baseline rows** in
  `scripts/api-compare/call-mismatches-exclude/abstractcontroller/helpers.json`.

- **Three `append_*_action` rows.** Rails defines them as
  `alias_method :"append_#{callback}_action", :"#{callback}_action"`
  (`callbacks.rb:252`) inside the `[:before, :after, :around].each` loop in
  `ClassMethods` (`:230-253`). RFC 0141's `append-action-aliases-missing`
  added them as `static appendBeforeAction = beforeAction` on
  `packages/actionpack/src/abstract-controller/base.ts:237`, so they still read
  missing on `callbacks.rb`.
  Abstractcontroller's extra-surface burn-down and gate enrollment are
  `burn-down-and-enroll-abstractcontroller` (RFC 0120).

## Acceptance criteria

- The four seats use `classAttribute()` / `mattrAccessor` at their Rails
  declaration sites.
- The `append_*_action` aliases are defined beside the `*_action` class methods
  in `abstract-controller/callbacks.ts`, not on `base.ts`.
- The three helper-resolution methods exist with Rails' bodies, and the five
  arity rows are gone: the methods are `this`-typed class methods.
- `helpers.json` is empty and its mark tightened.
- `pnpm parity:api --package abstractcontroller` reports every file except
  `rendering.rb` at 100%.

---
title: "Generated _layout/_layoutFromProc leak into action_methods once the _ filter is dropped"
status: draft
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails makes the generated layout methods private: `define_method :_layout_from_proc` / `private :_layout_from_proc` and `private :_layout` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:311-335`). So `public_instance_methods` never lists them as actions. trails' `_writeLayoutMethod` (`packages/actionview/lib/layouts.ts`) installs `_layout` and `_layoutFromProc` as string-keyed prototype members. trails has no runtime privates (root CLAUDE.md § "Method visibility is compile-time only").

Today the only thing keeping them out of `actionMethods` is the invented `_` filter in `packages/actionpack/lib/abstract-controller/base.ts`. trails#10188 tried dropping that filter (story `abstract-controller-action-methods-drops-underscore-filter`), and "when layout is specified as a proc, do not leak any methods into controller's action_methods" (`packages/actionview/test/actionpack/abstract/layouts.test.ts:424`) went red with `_layoutFromProc` and `_layout` listed as actions. On operator ruling, that change was dropped from the PR.

## Acceptance criteria

- The layout proc is reached in a way that lists no generated public name in `publicInstanceMethods`, so the `_` filter story can land.
- Converged shape to try first: `layoutDefinition` calls `layoutOption` directly with `this` bound, Ruby's `instance_exec` equivalent, so no `_layoutFromProc` is installed. `_layout` itself needs the same treatment, or an operator ruling.
- The layouts test above passes with the `_` filter removed.

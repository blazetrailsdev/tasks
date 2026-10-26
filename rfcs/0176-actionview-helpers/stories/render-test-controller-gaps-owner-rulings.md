---
title: "render-test-controller-gaps-owner-rulings"
status: done
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9336
claim: "2026-10-26T15:34:09Z"
assignee: "define-module-inline-methods-reach-the-api-extractor"
blocked-by: null
closed-reason: null
---

## Context

Left from `render-test-controller-gaps-remaining`. Four tests in
`packages/actionview/src/actionpack/controller/render.test.ts` stay parked as
`BLOCKED: render-test-controller-gaps-remaining`
(`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb`).
Each needs an owner ruling or a locals-binding change, not a local fix:

- `test_controller_does_not_leak_instance_variables` (`:786`): the view's ivar list differs from Rails' (`render_test.rb:131`). Needs a ruling on what a trails view's `instance_variables` are.
- `test_render_action_upcased` (`:850`): `_processRenderTemplateOptions` (`packages/actionview/src/rendering.ts:297`) applies the ratified `dasherize(underscore())`, which folds case, so `Hello_world` finds `hello-world`. Needs a ruling against packages/actionpack/CLAUDE.md, "An action's name is its method's name".
- `test_rendering_with_conflicting_local_vars` (`:1123`): `@name` and the private `name` helper (`render_test.rb:52-57`) are one JS property on the view. The `this.name = null` cast in `builderLayoutTest` (`render.test.ts:345`) cites this.
- `test_partial_with_hashlike_locals` (`:1234`): `ActionController::Parameters` as locals. Rails' `locals_code` (`actionview/lib/action_view/template.rb:561-572`) reads `local_assigns[:key]`; the stand-in's `__lookup` (`packages/trails-tsc/src/plugins/tse.ts` `scopeLines`) reads `name in locals` / `Reflect.get`, which a `Parameters` does not answer.

## Acceptance criteria

- Each test above is un-skipped and passes with the Rails body, or is parked under a `PERMANENT-SKIP:` line citing an owner ruling.
- Fixes land in the implementation, not by weakening the tests.

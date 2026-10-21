---
title: "render-test-controller-gaps-remaining"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

Remaining from `render-test-controller-gaps`. Tests in
`packages/actionview/src/actionpack/controller/render.test.ts` parked as
`BLOCKED: render-test-controller-gaps-remaining`
(`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb`):

- `test_controller_does_not_leak_instance_variables` (`:786`): a view's ivar set (`render_test.rb:131`) differs from Rails' list. Needs a decision on what a view's `instance_variables` are in trails.
- `test_render_action_upcased` (`:850`): `render action: "Hello_world"` finds `hello-world` because `_processRenderTemplateOptions` (`packages/actionview/src/rendering.ts:297`) applies the ratified `dasherize(underscore())`, which folds case. Needs an owner ruling on the conversion (packages/actionpack/CLAUDE.md, "An action's name is its method's name").
- `test_rendering_with_conflicting_local_vars` (`:1123`): `@name` and the private `name` helper (`render_test.rb:52-57`) share one JS property on the view. The `this.name = null` cast in `builderLayoutTest` cites this.
- `test_partial_with_hashlike_locals` (`:1234`): `ActionController::Parameters` used as locals. Rails' `locals_code` (`actionview/lib/action_view/template.rb:561-572`) reads `local_assigns[:key]`, but the trails locals binding reads properties.
- `test_template_annotations` / `test_line_offset_with_annotations_enabled` (`:1511`, `:1531`): annotations are added only in `Tse#call` (`packages/actionview/src/template/handlers/tse.ts:101-108`), and the precompiled/stand-in path (`virtualizeTse`) does not add them.
- The `tag().div` cast in the `field_error_proc` test (`render_test.rb:1356`): `tag()` returns `SafeBuffer | TagBuilder`, and `TagBuilder` has no typed element methods.

## Acceptance criteria

- [ ] Each test above is un-skipped and passes with the Rails body.
- [ ] Fixes land in the implementation, not by weakening the tests.

---
title: "render-test-controller-gaps"
status: claimed
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 5
pr: null
claim: "2026-10-21T16:42:07Z"
assignee: "tse-tracker-render-options-are-text-heuristics"
blocked-by: null
closed-reason: null
---

## Context

`port-controller-render-test-remaining` ported every test in
`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb` into
`packages/actionview/src/actionpack/controller/render.test.ts`. These tests are parked as
`it.skip` (marked `BLOCKED: render-test-controller-gaps`) because the implementation diverges:

- `test_controller_does_not_leak_instance_variables` (`render_test.rb:786`): the view's
  `instance_variables` list (`<%= instance_variables.sort %>`, `render_test.rb:131`) — needs a
  decision on what a view's ivar set is in trails.
- `test_render_action_upcased` (`:850`): `render action: "Hello_world"` renders `hello-world`
  instead of raising `ActionView::MissingTemplate` — the action-name to path conversion folds case.
- `test_render_with_filters` (`:1097`): `request.format = :xml` in a `before_action`
  (`render_test.rb:610-612`) — `ActionDispatch::Http::MimeNegotiation#format=` has no setter on
  trails' `Request`.
- `test_double_redirect` (`:1111`): `redirect_to action:` twice raises `TypeError` (`urlFor` of
  undefined) instead of `AbstractController::DoubleRenderError`; `redirect_to`'s
  `_compute_redirect_to_location` reaches no url helpers in an ActionController::TestCase.
- `test_rendering_with_conflicting_local_vars` (`:1123`): `TestController#name` private +
  `helper_method :name` (`render_test.rb:52-57`) — `this.name` ivar and the `name` helper share one
  JS property, so the template's `name` reads `"David"` instead of `nil`.
- `test_partial_with_hashlike_locals` (`:1234`): `render partial:, locals: ActionController::Parameters`
  — `PartialRenderer` does not read locals from a `Parameters` (Rails calls `to_hash`-like access).
- `test_partial_collection_shorthand_with_different_types_of_records` (`:1330`): the partial path
  for `BadCustomer` resolves to `bad-customers/_bad_customer`, but the fixture directory is
  `bad_customers` (`fixtures/actionpack/bad_customers`) — reconcile `to_partial_path` with the
  fixture layout.
- `test_partial_with_form_builder_and_invalid_model*` (`:1244-1275`): `ValidatingPost < Post`
  (`render_test.rb:37-41`) — `Post` from `controller/fake_models.rb` is not in
  `packages/actionview/src/test-helpers/fake-models.ts`.
- `test_template_annotations` / `..._do_not_render_for_non_html_format` (`:1500-1515`): with
  `annotate_rendered_view_with_filenames = true` and `DetailsKey.clear`, the controller render emits
  no `<!-- BEGIN` comment (template compile cache not keyed on the flag?).

- `test_line_offset` / `test_line_offset_with_annotations_enabled` (`:828`, `:1531`): the
  `ActionView::Template::Error` backtrace's first frame is `template.ts:504`, not the template's
  line 1 — `Template::Error#backtrace` should lead with the template frame.

- Casts in `render.test.ts` that cite this story: `request.format = :xml` in the
  `render_with_filters` `before_action` (`render_test.rb:609`, no `format=` setter in the
  `Request` type); `@name = nil` in `builder_layout_test` (`:243`, `name` is typed `string`
  because of the `name` helper collision above); `tag.div html, class: "errors"` in the
  `field_error_proc` (`:1356`, `tag()` returns an untyped `TagBuilder` with no `div`).

## Acceptance criteria

- [ ] Each test above is un-skipped in `render.test.ts` and passes with the Rails body.
- [ ] Fixes land in the implementation (not by rewording or weakening the tests).

---
title: "render with permitted Parameters: _normalize_args' options = action is not read as a Hash downstream"
status: draft
updated: 2026-10-05
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

`ActionView::Rendering#_normalize_args`
(`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:164-165`) takes a
permitted `ActionController::Parameters` as the options hash itself:
`options = action`. Everything downstream reads it like a Hash, so
`render params[:id].permit(:file)` reaches `TemplateRenderer#determine_template`'s
`options.key?(:file)` arm and raises `ArgumentError`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/template_renderer.rb:26-34`).

`packages/actionview/src/rendering.ts:212-213` makes the same assignment, but a
trails `Parameters` (`packages/actionpack/src/action-controller/metal/strong-parameters.ts`)
keeps its data in `_data`, and the render pipeline reads options as own
properties (`Object.prototype.hasOwnProperty.call(options, "file")`,
`packages/actionview/src/renderer/template-renderer.ts:45`). So no key is found
and the render falls through to an implicit template lookup, raising
`MissingTemplate` for `test/dynamicRenderPermit` where Rails raises
`ArgumentError`.

`ExpiresInRenderTest#test_permitted_dynamic_render_file_hash`
(`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:407-412`) is
parked `it.skip` under `BLOCKED:` naming this story in
`packages/actionpack/src/action-controller/controller/render.test.ts`.

## Acceptance criteria

- `render(params.permit("file"))` reads `file` off the permitted parameters
  and raises `ArgumentError` from `determineTemplate`'s `file` arm.
- "permitted dynamic render file hash" is unskipped and passes.

---
title: "Seat AbstractController::Rendering's hooks and the _default_form_builder class attribute"
status: draft
updated: 2026-09-28
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps: ["controller-render-converges-onto-abstract-controller-render"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package abstractcontroller` reports five declaration-only
rows on `abstract_controller/rendering.rb` (11/16). Each is a method Rails
defines on `AbstractController::Rendering` that trails declares there but
implements elsewhere:

- `render_to_body(options = {})` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/rendering.rb:50`)
- `rendered_format` (`:54`)
- `_set_html_content_type` (`:104`), `_set_vary_header` (`:107`),
  `_set_rendered_content_type(format)` (`:110`)

`ActionController::Rendering` overrides the last three
(`action_controller/metal/rendering.rb:210-222`), which is why trails put the
bodies there.

`form_builder.rb` is 2/5: `class_attribute :_default_form_builder, instance_accessor: false`
(`action_controller/form_builder.rb:35`) is missing; trails'
`packages/actionpack/src/action-controller/form-builder.ts` has
`default_form_builder` without the backing attribute.

## Acceptance criteria

- `abstract-controller/rendering.ts` defines the five Rails methods with Rails'
  (mostly empty) bodies; `action-controller/metal/rendering.ts` overrides the
  three it overrides in Rails.
- `_defaultFormBuilder` is a `classAttribute()` with `instanceAccessor: false`,
  and `defaultFormBuilder` reads and writes through it.
- `pnpm parity:api` reports `abstract_controller/rendering.rb` 16/16 and
  `form_builder.rb` 5/5.

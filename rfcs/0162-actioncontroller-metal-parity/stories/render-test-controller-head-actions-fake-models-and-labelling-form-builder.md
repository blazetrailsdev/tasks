---
title: "render_test.rb's TestController lacks its head_* actions, fake_models' Customer and LabellingFormBuilder"
status: in-progress
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#8603
claim: "2026-10-06T22:33:12Z"
assignee: "expo-sqlite-exec-raises-sqlite3-gem-exception-classes"
blocked-by: null
closed-reason: null
---

## Context

trails PR 8554 ported `TestController`
(`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:76-340`) into
`packages/actionpack/src/action-controller/controller/render.test.ts` without
three parts of it:

- The `head_*` actions (`render_test.rb:245-311`): `head_created`,
  `head_created_with_application_json_content_type`,
  `head_ok_with_image_png_content_type`, `head_ok_with_string_key_content_type`,
  `head_with_location_header`, `head_with_location_object`,
  `head_with_symbolic_status`, `head_with_integer_status`,
  `head_with_string_status`, `head_with_custom_header`,
  `head_with_www_authenticate_header`, `head_with_status_code_first`,
  `head_and_return`, `head_with_no_content`, `head_default_content_type`.
  `HeadRenderTest` (`:844`), owned by
  `port-render-test-etag-head-and-http-cache`, drives them.
- `head_with_location_object` builds `Customer.new("david", 1)` from
  `vendor/rails/v8.0.2/actionpack/test/lib/controller/fake_models.rb:5-33`
  (`require "controller/fake_models"`, `render_test.rb:4`). actionpack has no
  port of that file; `packages/actionpack/src/test-helpers/lib/controller/`
  holds only `fake-controllers.ts`.
- The nested `LabellingFormBuilder < ActionView::Helpers::FormBuilder`
  (`render_test.rb:81-82`). `FormBuilder` is defined at
  `packages/actionview/src/helpers/form-helper.ts:499` but is exported from
  neither actionview's index nor a subpath actionpack can import.

## Acceptance criteria

- `TestController` in `controller/render.test.ts` holds every `head_*` action
  at its Rails position, each body line for line with `render_test.rb:245-311`.
- `test-helpers/lib/controller/fake-models.ts` ports `Customer` from
  `test/lib/controller/fake_models.rb:5-33`, and `headWithLocationObject`
  uses it.
- `TestController.LabellingFormBuilder` extends actionview's `FormBuilder`,
  imported through an export actionview publishes.

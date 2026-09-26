---
title: "Port the remaining layout_test.rb cases (LayoutAutoDiscoveryTest, status, symlink)"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
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

trails#8152 ported `ActionView::Layouts` (`packages/actionview/src/layouts.ts`) and
13 of the 21 tests in
`vendor/rails/v8.0.2/actionview/test/actionpack/controller/layout_test.rb` into
`packages/actionview/src/actionpack/controller/layout.test.ts`. Still unported
(streaming is separately `controller-render-stream-option-is-ignored`):

- `LayoutAutoDiscoveryTest` (`:52-96`): `test_application_layout_is_default_when_no_controller_match`,
  `test_controller_name_layout_name_match`, `test_third_party_template_library_auto_discovers_layout`,
  `test_namespaced_controllers_auto_detect_layouts1` / `2`. They exercise the implied
  `_implied_layout_name` walk (`layouts.rb:286-294,340-343`) that #8152 now implements,
  and use `with_template_handler` (`:18-29`) for `.mab`.
- `LayoutStatusIsRenderedTest` (`:261-276`), `render action: "hello", status: 401`.
- The symlinked-layout test (`:278-295`), skipped on Windows in Rails.

`packages/actionpack/src/action-controller/base-layout.trails.test.ts` still
carries trails-only cases that duplicate these (default layout, missing layout,
explicit `layout:`), which the Rails ports should replace.

## Acceptance criteria

- The seven cases above are ported with Rails' names verbatim, using
  `FixtureResolver` fixtures mirroring
  `vendor/rails/v8.0.2/actionview/test/fixtures/actionpack/layout_tests/`.
- The `base-layout.trails.test.ts` cases a Rails port now covers are deleted.

---
title: "Port the remaining form_tag tests (enforce_utf8, block in ERB)"
status: draft
updated: 2026-10-05
rfc: "0176-actionview-helpers"
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

trails PR 8510 ported `ActionView::Helpers::FormTagHelper#form_tag`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_tag_helper.rb:78-85`) and
nine of its tests into `packages/actionview/src/template/form-tag-helper.test.ts`
(`form tag` through `form tag with false action`,
`vendor/rails/v8.0.2/actionview/test/template/form_tag_helper_test.rb:126-184`).

Still unported from the same block:

- `test_form_tag_enforce_utf8_true` / `_false` and
  `test_form_tag_default_enforce_utf8_false` / `_true` (`:186-214`). They need the test's
  `with_default_enforce_utf8` helper over `FormTagHelper.default_enforce_utf8`
  (trails: `setDefaultEnforceUtf8` in `packages/actionview/src/helpers/form-tag-helper.ts`).
- `test_form_tag_with_block_in_erb` and `test_form_tag_with_block_and_method_in_erb`
  (`:217-232`). They go through `render_erb`, which the trails test file has no port of.
  The block arm is covered only by the TS-only
  `packages/actionview/src/template/form-tag-helper.trails.test.ts`.

## Acceptance criteria

- The six tests are ported under `FormTagHelperTest` at their Rails names, in Rails order.
- `render_erb` is ported for the test file as Rails' `ActionView::TestCase` provides it.
- `form-tag-helper.trails.test.ts`'s block case is deleted once the ERB tests cover it.

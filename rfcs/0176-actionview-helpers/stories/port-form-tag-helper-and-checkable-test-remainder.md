---
title: "port-form-tag-helper-and-checkable-test-remainder"
status: draft
updated: 2026-10-19
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

`port-form-field-tag-and-checkable-remaining-tests` ported the remaining
`vendor/rails/v8.0.2/actionview/test/template/form_tag_helper_test.rb` tests into
`packages/actionview/src/template/form-tag-helper.test.ts`, except (LOC ceiling / dependencies):

- `test_file_field_tag_with_direct_upload_when_rails_direct_uploads_url_is_defined` (`:351`) — needs
  `WithActiveStorageRoutesControllers` (`:10-18`), an `ActionController::Base` with ActiveStorage routes;
  actionview does not depend on actionpack.
- `test_text_field_tag_with_ac_parameters` (`:564`) — needs `ActionController::Parameters`.
  Both are parked as `it.skip` under `BLOCKED: port-form-tag-helper-and-checkable-test-remainder`.
- The five `*_options_symbolize_keys_side_effects` tests (`:945-973`).
- `test_button_tag_defaults_with_block_and_options` (`:878`) and `test_image_submit_tag_with_confirmation` (`:898`).
- All of the `form_helper_test.rb` half of the old story: the remaining `file_field_*`,
  `checkbox_*` / `check_box_*`, `radio_button_*`, `button_with_*` tests and `test_default_form_builder`
  (needs the `LabelledFormBuilder` test class), in `packages/actionview/src/template/form-helper.test.ts`.

## Acceptance criteria

- [ ] The five symbolize-keys side-effect tests, the two button/image-submit tests above, and the listed `form_helper_test.rb` tests are ported at their Rails names, in Rails order.
- [ ] The two parked tests run (via an actionview-side test controller or a dependency decision), or stay parked with a story naming the blocker.

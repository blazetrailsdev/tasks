---
title: "FormTagHelper: port the 29 *_tag field methods (select_tag, text_field_tag, …)"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 500
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FormTagHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_tag_helper.rb`) is missing its 29 field-tag methods on origin/main: `select_tag`, `text_field_tag`, `hidden_field_tag`, `file_field_tag`, `password_field_tag`, `textarea_tag`/`text_area_tag`, `checkbox_tag`/`check_box_tag`, `radio_button_tag`, `button_tag`, `image_submit_tag`, `field_set_tag`/`fieldset_tag`, the `color/search/telephone/phone/date/time/datetime/datetime_local/month/week/url/email/number/range_field_tag` family, and private `convert_direct_upload_option_to_url`. `git grep textFieldTag origin/main -- packages/actionview/src/helpers/form-tag-helper.ts` is empty. Because FormHelper and Tags::Base include FormTagHelper, the same 29 also show missing on `form_helper.rb`, `tags/base.rb` and `helpers.rb`.

## Acceptance criteria

- [ ] All 29 ported in `packages/actionview/src/helpers/form-tag-helper.ts`, in Rails order, installed on the live `FormTagHelper` Module (alias pairs as aliases).
- [ ] Matching `form_tag_helper_test.rb` cases ported.
- [ ] parity: `form_tag_helper.rb` and `tags/base.rb` rows reach 0 missing.

---
title: "Port FormOptionsHelper, Tags::SelectRenderer and Tags::Select"
status: in-progress
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: ["port-form-tag-helper-field-tag-methods"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9000
claim: "2026-10-17T01:31:17Z"
assignee: "cache-store-async-consumers"
blocked-by: null
closed-reason: null
---

## Context

`FormOptionsHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_options_helper.rb`, 21 defs), `Tags::SelectRenderer` (`select_content_tag`, `placeholder_required?`, `add_options`) and `Tags::Select` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/`) are unported; no `form-options-helper.ts`, `select-renderer.ts` or `select.ts` on origin/main. Rails tests `form_options_helper_test.rb` and `form_options_helper_i18n_test.rb` are unported. The other select tags are `port-collection-grouped-time-zone-weekday-select-tags`.

## Acceptance criteria

- [ ] `helpers/form-options-helper.ts` as a live Module (`select`, the `*options_for_select` / `options_from_collection_for_select` / `option_groups_from_collection_for_select` / `grouped_options_for_select` / `time_zone_options_for_select` / `weekday_options_for_select` family, privates), included where Rails includes it; FormBuilder#select.
- [ ] `tags/select-renderer.ts`, `tags/select.ts`.
- [ ] The `options_for_select` / `select` parts of both test files ported (the rest go with the sibling story).

---
title: "Port TagHelper, Tags::ActionText and rich_textarea, with form_helper_test"
status: draft
updated: 2026-11-03
rfc: "0219-actiontext-port"
cluster: at-views
packages: ["actiontext"]
deps: ["actiontext-content-helper-and-views", "activestorage-routes-and-controller-concerns"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/app/helpers/action_text/tag_helper.rb` (106):
  `cattr_accessor(:id, instance_accessor: false) { 0 }` (`:10`),
  `rich_textarea_tag` (`:30-45`, writes `data-direct-upload-url` /
  `data-blob-url-template` from `main_app.rails_direct_uploads_url` and
  `rails_service_blob_url`), alias `rich_text_area_tag`;
  `ActionView::Helpers::Tags::ActionText < Tags::Base` with
  `Tags::Placeholderable` (`:50-63`); `FormHelper#rich_textarea` (`:87-90`) and
  `FormBuilder#rich_textarea` (`:101-104`) with their `rich_text_area`
  aliases.
- Tags::Placeholderable is ported
  (`packages/actionview/src/helpers/tags/placeholderable.ts`, used by
  `text-field.ts`).
- Test: `test/template/form_helper_test.rb` (14).

## Acceptance criteria

- `FormHelper#rich_textarea` / `FormBuilder#rich_textarea` live where the
  owner's answer to the RFC's open question 3 puts them, with no `Module`
  carrier and no includer list.
- `Tags::ActionText` keeps its Rails class path (seated on
  `ActionView.Helpers.Tags`) and `delegate :dom_id`.
- `options.symbolize_keys` is omitted per CLAUDE.md § "`symbolize_keys` on an
  option hash"; `options.fetch("value") { value }` keeps the block arm.
- The 14 tests pass.

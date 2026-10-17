---
title: "Port Tags::CollectionHelpers, CollectionCheckBoxes, CollectionRadioButtons"
status: done
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps:
  ["port-form-options-helper-and-select-tag", "port-form-helper-file-field-check-box-radio-button"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9008
claim: "2026-10-17T18:40:29Z"
assignee: "nokogiri-html5-document-parse-signature"
blocked-by: null
closed-reason: null
---

## Context

`Tags::CollectionHelpers` (12 defs incl. the inner `Builder`), `Tags::CollectionCheckBoxes` and `Tags::CollectionRadioButtons` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/`) are unported, along with `FormOptionsHelper#collection_check_boxes` / `collection_checkboxes` / `collection_radio_buttons`. Rails test `actionview/test/template/form_collections_helper_test.rb` is unported. Needs CheckBox/RadioButton tags and FormOptionsHelper first.

## Acceptance criteria

- [ ] `tags/collection-helpers.ts`, `collection-check-boxes.ts`, `collection-radio-buttons.ts` ported; FormBuilder exposes the collection methods.
- [ ] `form_collections_helper_test.rb` is moved to `port-form-collections-helper-test`: every assertion in it is `assert_select`, which trails has not ported.
- [ ] parity rows for these three files at 0 missing.

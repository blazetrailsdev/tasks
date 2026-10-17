---
title: "port-form-collections-helper-test"
status: draft
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - port-rails-dom-testing-selector-assertions
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

`port-collection-check-boxes-and-radio-buttons-tags` ported `Tags::CollectionHelpers`,
`CollectionCheckBoxes`, `CollectionRadioButtons` and `FormOptionsHelper#collection_checkboxes` /
`collection_radio_buttons` (`packages/actionview/src/helpers/tags/collection-*.ts`), but not the Rails test
`vendor/rails/v8.0.2/actionview/test/template/form_collections_helper_test.rb` (69 tests). Every one of its assertions is
`assert_select` / `assert_no_select` (`form_collections_helper_test.rb:8-10`), and trails has no
`Rails::Dom::Testing::Assertions::SelectorAssertions` port: `git grep assertSelect -- packages` is empty, and
`@blazetrails/nokogiri` has no CSS selector support. `HTML5::Document` now parses with Nokogiri's signature
(`packages/nokogiri/src/html5/document.ts`), so a selector engine over it is the missing part. Until then the paths
are covered by `packages/actionview/src/template/form-collections-helper.trails.test.ts` with `assertDomEqual`.

The tests that use `:to_s` as the value/text method pass `"toString"` (Ruby `true.to_s` has no `rbFPublicSend`
answer), and the "correctly builds unique DOM IDs for float values" tests depend on `1.0.to_s == "1.0"`, which a JS
number cannot reproduce.

## Acceptance criteria

- [ ] `assert_select` (rails-dom-testing `selector_assertions.rb`) is ported, or this story is wired with a `deps` edge to the story that ports it.
- [ ] `form_collections_helper_test.rb` is ported as `packages/actionview/src/template/form-collections-helper.test.ts` with Rails test names verbatim; the float-ID tests are parked with the reason above.
- [ ] `form-collections-helper.trails.test.ts` is deleted once the Rails port covers its paths.

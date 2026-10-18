---
title: "Port rails-dom-testing SelectorAssertions#assert_select over HTML5 css"
status: done
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9031
claim: "2026-10-18T16:14:52Z"
assignee: "port-helper-test-small-remainders"
blocked-by: null
closed-reason: null
---

## Context

trails has no `assert_select`. `git grep assertSelect -- packages` is empty, and `@blazetrails/nokogiri` has no CSS selector support. The source to port is `vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions.rb` (`assert_select`, `css_select`, `assert_dom`, with `HTMLSelector` in `selector_assertions/html_selector.rb`). It needs a CSS-selector `css` / `at_css` on `HTML5::Document` and `HTML5::DocumentFragment` (`packages/nokogiri/src/html5/`), mirroring Nokogiri's `lib/nokogiri/xml/searchable.rb` (vendored at `vendor/nokogiri/v1.18.3`).

It blocks:

- `port-form-collections-helper-test` (`form_collections_helper_test.rb`, 69 tests)
- `action-controller-test-case-has-no-assert-select`

## Acceptance criteria

- [ ] `Searchable#css` on the HTML5 document and fragment.
- [ ] `SelectorAssertions#assert_select` / `css_select` ported at the rails-dom-testing path, with `assert_dom` as its alias.
- [ ] `port-form-collections-helper-test` gets a `deps` edge to this story.

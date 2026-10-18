---
title: "Port SelectorAssertions#assert_dom_encoded and #assert_dom_email"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-rails-dom-testing-selector-assertions` ported `css_select` / `assert_dom` / `assert_select` (`packages/actionview/src/testing/selector-assertions.ts`) from `vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions.rb`. Still unported: `assert_dom_encoded` / `assert_select_encoded` (`:250-266`, which needs `Node#cdata?` / `#blank?` / `#content` on `@blazetrails/nokogiri`'s HTML5 node) and `assert_dom_email` / `assert_select_email` (`:290-302`, which needs `ActionMailer::Base.deliveries`). The Rails tests "feed item encoded" and "feed item encoded with html version" (`vendor/rails-dom-testing/v2.2.0/test/selector_assertions_test.rb:266-354`) wait on the first.

## Acceptance criteria

- [ ] `assertDomEncoded` / `assertSelectEncoded` ported at the rails-dom-testing path, with the two feed-item tests.
- [ ] `assertDomEmail` / `assertSelectEmail` ported, or filed against the ActionMailer port if that is still absent.

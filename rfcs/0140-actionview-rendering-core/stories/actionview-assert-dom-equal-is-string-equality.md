---
title: "assertDomEqual is string equality, not rails-dom-testing DOM equality"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' ActionView tests assert HTML with `assert_dom_equal`, which comes from
rails-dom-testing (`Rails::Dom::Testing::Assertions::DomAssertions`, included by
`ActionView::TestCase`). It parses both sides and compares the DOM, so attribute
order doesn't matter. Tables like `AutoDiscoveryToTag` and `FaviconLinkToTag`
(`vendor/rails/v8.0.2/actionview/test/template/asset_tag_helper_test.rb:86-100`,
`:312-318`) write `href` first, even though `tag` emits `rel`/`type`/`href`.

In trails, four test files each define their own `assertDomEqual` as
`expect(String(actual)).toEqual(expected)`:

- `packages/actionview/src/template/asset-tag-helper.test.ts:40`
- `packages/actionview/src/template/tag-helper.test.ts:21`
- `packages/actionview/src/template/url-helper.test.ts:22`
- `packages/actionview/src/template/form-helper/form-with.test.ts`

Because the helper compares strings, every expected string in those files is
rewritten into trails' emission order and no longer matches the Rails table
verbatim (for example, #8204 reordered the whole `AutoDiscoveryToTag` and
`FaviconLinkToTag` tables). rails-dom-testing is not vendored under `vendor/`.

## Acceptance criteria

- One shared `assertDomEqual` / `assertDomNotEqual` that parses both sides and
  compares elements, attributes (ignoring order) and text, as rails-dom-testing's
  `equal_children?` / `equal_attribute_nodes?` do. Vendor rails-dom-testing if a
  source is needed to cite.
- The four local copies are deleted and replaced with the shared helper.
- Expected strings in those files go back to the Rails text verbatim.

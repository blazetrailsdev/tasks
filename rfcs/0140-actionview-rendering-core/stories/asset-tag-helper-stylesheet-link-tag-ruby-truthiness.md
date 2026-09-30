---
title: "Converge stylesheetLinkTag's truthiness guards and uniq onto Rails; enroll its no-request/streaming tests"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`stylesheetLinkTag` (`packages/actionview/src/helpers/asset-tag-helper.ts`) tests
its Ruby `if` guards with `=== true` where Rails uses plain truthiness
(nil/false-only falsiness):

- `if use_preload_links_header` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:214`, `:237`)
- `preload_link += "; nopush" if nopush` (`:218`)
- `if apply_stylesheet_media_default && tag_options["media"].blank?` (`:230`)

It also de-duplicates with `[...new Set(rawSources.map(String))]` where Rails'
`sources.uniq` (`:212`) does not stringify. That means `String(null)` becomes
`"null"`, where Rails would hand `nil` to `path_to_stylesheet` and raise.

Its sibling `javascriptIncludeTag` (trails#8208) already ports the same arms
with `rtest(...)` and `[...new Set(sources)]`.

Also, two Rails tests in the no-request and streaming classes are not enrolled:
`AssetTagHelperWithoutRequestTest#test_stylesheet_link_tag_without_request`
(`actionview/test/template/asset_tag_helper_test.rb:1078`) and
`AssetTagHelperWithStreamingRequest#test_stylesheet_link_tag_with_streaming`
(`:1100`). Their `javascript_include_tag` twins are already in
`template/asset-tag-helper.test.ts`.

## Acceptance criteria

- `stylesheetLinkTag` uses `rtest(...)` for the `use_preload_links_header`,
  `nopush` and `apply_stylesheet_media_default` guards, and `[...new Set(sources)]`
  with no `String` mapping. It mirrors `asset_tag_helper.rb:202-242`.
- Both stylesheet tests are enrolled under their verbatim names in the
  `AssetTagHelperWithoutRequestTest` / `AssetTagHelperWithStreamingRequest` describes.

---
title: "TagBuilder multi-word element names follow the Node-casing rule"
status: draft
updated: 2026-11-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TagBuilder#method_missing` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb`,
`tag_string(name.to_s.dasherize, ...)`) is ported in
`packages/actionview/lib/helpers/tag-helper.ts` (`methodMissing`, `dasherize` replaces `_` only).
So a multi-word element is reached through a snake_case method (`tag.img_slider` →
`<img-slider>`, `tag-helper.test.ts` "tag builder dasherize names"), which the Node-casing
rule forbids for a JS identifier. A camelCase method cannot simply be kebab-translated:
SVG elements are camelCase (`tag.linearGradient`, `foreignObject`) and must pass through.
trails#10362 worked around this for turbo by calling `tag()["turbo-stream"]`
(`packages/turbo/lib/app/helpers/turbo/streams/action-helper.ts`).
`prefix_tag_option` already translates camelCase keys (trails#10362).

## Acceptance criteria

- Operator ruling on how a multi-word custom element is named through the tag builder
  (camelCase hump translation with an SVG exception list, or the kebab name as a computed key).
- `methodMissing` implements the ruling; `action-helper.ts` and the dasherize test follow it.

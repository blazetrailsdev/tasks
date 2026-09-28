---
title: "TagBuilder owns content_tag_string / tag_options / tag_option as instance methods"
status: draft
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `TagHelper::TagBuilder` owns the whole option-rendering chain as instance methods:
`content_tag_string` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb:239`),
`tag_options` (`:248`), `boolean_tag_option` (`:290`), `tag_option` (`:294`) and the private
`prefix_tag_option` (`:312`). `TagHelper#content_tag` / `#tag` reach them through `tag_builder`.

In trails (`packages/actionview/src/helpers/tag-helper.ts`) these are module-level functions:
`booleanTagOption` (~:158), `tagOption` (~:162), `prefixTagOption` (~:203), `tagOptions` (~:222) and
`contentTagString` (~:320). `TagBuilder#tagString` / `#selfClosingTagString` / `#attributes`
call them as free functions, so they are not TagBuilder members. `parity:api` therefore cannot
credit them against `tag_helper.rb`'s TagBuilder, and a subclass or instance cannot override them
as Rails allows. Found while converging TagBuilder's `define_element` methods (trails#8235).

## Converged shape

- `contentTagString`, `tagOptions`, `booleanTagOption` and `tagOption` become public `TagBuilder`
  instance methods. `prefixTagOption` becomes a private one (`@internal` per `rails-private-jsdoc`).
  Signatures and branch order follow `:239-316`, including `content_tag_string`'s
  `tag_options = tag_options(options, escape) if options` and `escape && content.present?` arms.
- The helper-level callers (`contentTag`, `tag(name)`, `tokenList`'s paths) go through
  `tagBuilder.call(this)` as Rails' `tag_builder.content_tag_string(...)` does.

## Acceptance criteria

- No module-level `tagOptions` / `tagOption` / `booleanTagOption` / `prefixTagOption` /
  `contentTagString` remain in `tag-helper.ts`.
- `tag-helper.test.ts` and `tag-helper.trails.test.ts` stay green, and `parity:api` credits the
  five methods to `tag_helper.rb`.

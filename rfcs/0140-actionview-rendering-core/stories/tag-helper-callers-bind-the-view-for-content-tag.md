---
title: "content_tag/tag take a bound view; simple_format, javascript_tag and debug send them to self"
status: in-progress
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8236
claim: "2026-09-28T22:48:37Z"
assignee: "generated-db-ts-connect-resolves-default-env"
blocked-by: null
closed-reason: null
---

## Context

`content_tag` and `tag` are `TagHelper` instance methods in Rails
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb:479-486,516-524`). Every
caller reaches them through `self`, the view. `content_tag`'s block arm is `capture(&block)`, and
`tag` with no name is `tag_builder`, which is `@tag_builder ||= TagBuilder.new(self)` (`:600-602`).

trails#8177 made both capture through the view. It had to type them
`this: TagHelperHost | void` and cast (`packages/actionview/src/helpers/tag-helper.ts`
`contentTag`, `tag`), because these helpers still call `contentTag` unbound:

- `helpers/text-helper.ts:243,247` (`simple_format`, `text_helper.rb`)
- `helpers/javascript-helper.ts:69` (`javascript_tag`, `javascript_helper.rb`)
- `helpers/debug-helper.ts:8,10` (`debug`, `debug_helper.rb`)

Each Rails body calls `content_tag` on self.

## Converged shape

- The three callers are `this`-typed module functions that call `contentTag.call(this, ...)`, as
  their Rails bodies send `content_tag` to self.
- `contentTag` and `tag` take `this: TagHelperHost` with no `void` arm and no cast.

## Acceptance criteria

- No `this: TagHelperHost | void` or `as TagHelperHost` remains in `tag-helper.ts`.
- `simple_format`, `javascript_tag` and `debug` tests pass with a bound view.

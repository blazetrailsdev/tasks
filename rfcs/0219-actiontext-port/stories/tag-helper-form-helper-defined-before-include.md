---
title: "TagHelper's FormHelper/FormBuilder reopen must exist before ActionView::Base includes Helpers"
status: done
updated: 2026-11-18
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10251
claim: "2026-11-17T15:51:33Z"
assignee: "tag-helper-form-helper-defined-before-include"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actiontext/app/helpers/action_text/tag_helper.rb` reopens
`ActionView::Helpers::FormHelper` (`rich_textarea`) and `FormBuilder`. trails writes these
with `Object.assign(FormHelper.prototype, …)` / `Object.assign(FormBuilder.prototype, …)` in
`packages/actiontext/lib/tag-helper.ts`. That runs after `ActionView::Base` has already
copied `Helpers` (`packages/actionview/lib/base.ts:411`, `include(Base, Helpers)`), so a
controller-rendered view has no `richTextarea`. trails#10099 worked around it only for tests,
by putting `lib/tag-helper.ts` ahead of the ActionView setup in the `activerecord` vitest project's
`setupFiles` (`vitest.config.ts`). An app that loads ActionView first still hits
`this._template.richTextarea is not a function`.

CLAUDE.md § "A Ruby module is a JS object or a JS class": a method defined on a module after it
is included must be ported so that the definition exists before the include.

## Ruling (operator, 2026-11-17)

Widen the `RoutesHelpers.with` includer-list exception (trails CLAUDE.md § "A Ruby
module is a JS object or a JS class") to this reopen. `FormHelper` and `FormBuilder`
keep a weak list of the prototypes that copied their members (the
`_appendIncluder` / `isIncludedMember` shape `NamedRouteCollection` uses), and
ActionText's `tag-helper.ts` writes `richTextarea` / `richTextArea` through to
each recorded includer. No carrier is spliced into a prototype chain. Not
"move richTextarea into actionview".

## Acceptance criteria

- `richTextarea` / `richTextArea` reach an `ActionView::Base` view in any load order, with no
  carrier, through the includer list the ruling above licenses.
- Remove `lib/tag-helper.ts` from the `vitest.config.ts` setupFiles.
- `controller-render.test.ts` "renders Trix with content attachment as HTML when the request
  format is not HTML" still passes.

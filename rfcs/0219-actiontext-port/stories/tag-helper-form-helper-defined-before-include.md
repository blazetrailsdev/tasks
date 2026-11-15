---
title: "TagHelper's FormHelper/FormBuilder reopen must exist before ActionView::Base includes Helpers"
status: ready
updated: 2026-11-14
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
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

## Acceptance criteria

- `richTextarea` / `richTextArea` reach an `ActionView::Base` view in any load order, with no
  carrier and no includer list (for example, ActionView's FormHelper sources the definitions
  before `Base` includes `Helpers`, or the engine boot orders it).
- Remove `lib/tag-helper.ts` from the `vitest.config.ts` setupFiles.
- `controller-render.test.ts` "renders Trix with content attachment as HTML when the request
  format is not HTML" still passes.

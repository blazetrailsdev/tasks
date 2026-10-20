---
title: "render-test-surfaced-rendering-gaps"
status: draft
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
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

Rendering gaps surfaced while porting the rest of
`vendor/rails/v8.0.2/actionview/test/template/render_test.rb` into
`packages/actionview/src/template/render.test.ts`. Each is parked there as
`it.skip` naming this story:

- `render partial use last prepended format for partials with the same names` (`render_test.rb:115`): a partial rendered with `formats: :json` leaves `:json` ahead of `:html` for the next partial; trails renders "JSON" where Rails renders "HTML".
- `render template with handlers` (`:138`): there is no `:builder` template handler (`action_view/template/handlers/builder.rb`).
- `render template with localization on context level` / `render template with dashed locale` (`:170`, `:177`): `view.locale = "da"` raises `I18n::InvalidLocale` after `store_translations "da", {}` (`render_test.rb:34-35`).
- `without compiled method container is deprecated` (`:458`): `Base#compiled_method_container` raises `NotImplementedError` (`action_view/base.rb:271-278`), but trails wraps it in `Template::Error`.
- `render layout with a nested render layout call using block with render partial` (`:693`) and `cache fragments inside render layout call with block` (`:812`): a `render layout:` block whose body awaits a nested `render`/`cache` yields a Promise to `capture`, "no implicit conversion of Promise into String" / an empty capture.
- `render with nested layout` (`:738`): `content_for :column do ... end` captures the outer `render layout:` block's content instead of its own.

## Acceptance criteria

- [ ] Each test listed above is un-skipped and passes with the Rails assertions.

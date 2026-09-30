---
title: "ActionView::Helpers modules are flattened namespaces; Base copies helpers instead of include Helpers"
status: draft
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8268 converted only `TagHelper`, `FormTagHelper` and `ActiveModelInstanceTag` into live `Module`s. The helper modules they include are still ES module namespaces, and `Module#include` flattens those as plain objects:

- `CaptureHelper` and `OutputSafetyHelper` (`tag_helper.rb:17-18`)
- `UrlHelper`, `TextHelper` and `ContentExfiltrationPreventionHelper` (`form_tag_helper.rb:22-24`)

So their own includes are not modeled:

- `url_helper.rb:26-27`: `include TagHelper`, `include ContentExfiltrationPreventionHelper`
- `text_helper.rb:39-41`: `include SanitizeHelper`, `TagHelper`, `OutputSafetyHelper`

Nothing can `super` into them.

`ActionView::Base` gets its helpers by copying every lowercase function of `helpers/index.ts` onto its prototype (`packages/actionview/src/base.ts`, the `for (const [name, value] of Object.entries(Helpers))` loop). Rails does `include Helpers` (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb`), where `Helpers` includes each helper module (`helpers.rb`).

## Converged shape

- Each `ActionView::Helpers::*` module is a live `Module` declared in its own file, with its Rails includes in Rails' order, as `TagHelper` / `FormTagHelper` now are.
- `ActionView::Helpers` includes them in `helpers.rb`'s order.
- `Base` does `include(Base, Helpers)` in place of the copy loop.

## Acceptance criteria

- `UrlHelper`, `TextHelper`, `CaptureHelper`, `OutputSafetyHelper`, `ContentExfiltrationPreventionHelper` and `SanitizeHelper` are `Module`s with their Rails includes.
- `TagHelper` / `FormTagHelper` include those Modules rather than namespaces.
- `base.ts` includes `Helpers` rather than copying functions. The install loop is deleted.
- Built `dist` modules import cleanly as plain-node entry modules (no TDZ).

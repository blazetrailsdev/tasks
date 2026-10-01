---
title: "actionview-remaining-helper-namespaces-as-live-modules"
status: ready
updated: 2026-10-01
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

`actionview-helper-modules-as-live-modules` made `CaptureHelper`, `OutputSafetyHelper`, `ContentExfiltrationPreventionHelper`, `SanitizeHelper`, `UrlHelper`, `TextHelper`, `RenderingHelper` and `ActionView::Context` live `Module`s, added `packages/actionview/src/helpers.ts` (`ActionView::Helpers`, `vendor/rails/v8.0.2/actionview/lib/action_view/helpers.rb:30-66`), and replaced `base.ts`'s copy loop with `include(Base, Context); include(Base, Helpers)` (`base.rb:158`).

What is left in `packages/actionview/src/helpers.ts` and `base.ts`:

- Nine helper files are still ES module namespaces that `Helpers` flattens onto its own method table with `mod.include(namespace)`: `AssetTagHelper`, `AssetUrlHelper`, `CacheHelper`, `ControllerHelper`, `DateHelper`, `DebugHelper`, `FormHelper`, `JavaScriptHelper`, `NumberHelper`. Their own Rails includes are not modeled (e.g. `asset_tag_helper.rb:21-22` `include AssetUrlHelper` / `include TagHelper`; `form_helper.rb:112-116`), nothing can `super` into them, and flattening also installs non-helper exports such as `installControllerDelegates` and the `set*` config writers as view methods.
- `base.rb:158` is `include Helpers, ::ERB::Util, Context`. `base.ts` still copies `TseUtil` (`h`, `htmlEscape`, ...) onto `Base.prototype` as own properties, so those outrank `Helpers` where Rails puts `ERB::Util` beneath it.
- `UrlHelper` and `SanitizeHelper` `extend ActiveSupport::Concern` (`url_helper.rb:24-33`, `sanitize_helper.rb:14,160-206`). `base.ts` extends `UrlHelper`'s `ClassMethods` by hand and does not extend `SanitizeHelper::ClassMethods` at all, so `ActionView::Base.full_sanitizer` does not exist. `sanitize-helper.ts` keeps the sanitizer memos as module-level state where Rails keeps them as ivars on the including class (`sanitize_helper.rb:181-203`), and `strip_tags` / `strip_links` do not go through `self.class` (`:139-158`).
- `Helpers` omits the modules trails has not ported: `ActiveModelHelper`, `AtomFeedHelper`, `CspHelper`, `CsrfHelper`, `FormOptionsHelper`, `TranslationHelper`.

## Acceptance criteria

- Each of the nine helper files declares a live `Module` with its Rails includes in Rails' order, and `helpers.ts` includes those Modules rather than namespaces.
- `base.ts` includes an `ERB::Util` module between `Context` and `Helpers` instead of copying `TseUtil` onto the prototype.
- `SanitizeHelper::ClassMethods` and `UrlHelper::ClassMethods` reach `Base` through the Concern, and the sanitizer memos live on the including class.
- Built `dist` modules still import cleanly as plain-node entry modules.

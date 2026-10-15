---
title: "actionview-url-and-sanitize-helper-concerns-and-sanitizer-memos"
status: draft
updated: 2026-10-15
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

`actionview-remaining-helper-namespaces-as-live-modules` turned the nine
namespace helpers (`AssetTagHelper` … `NumberHelper`), `ModelNaming` and
`RecordIdentifier` into live `Module`s with their Rails includes, and replaced
`base.ts`'s `TseUtil` prototype copy with `include(Base, TseUtil)` between
`Context` and `Helpers` (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:158`).
Two items of that story did not fit its PR:

- `UrlHelper` and `SanitizeHelper` `extend ActiveSupport::Concern`
  (`actionview/lib/action_view/helpers/url_helper.rb:24-33`,
  `sanitize_helper.rb:14,160-206`). `packages/actionview/src/base.ts` still
  does `extend(Base, UrlHelperClassMethods)` by hand and never extends
  `SanitizeHelper::ClassMethods`, so `ActionView::Base.full_sanitizer` does not
  exist.
- `packages/actionview/src/helpers/sanitize-helper.ts` keeps the sanitizer memos
  (`_fullSanitizer` etc.) as module-level state where Rails keeps them as ivars
  on the including class (`sanitize_helper.rb:181-203`), and `strip_tags` /
  `strip_links` do not go through `self.class` (`sanitize_helper.rb:139-158`);
  `getSanitizerVendor` carries a `@noRailsEquivalent CONVERGEABLE` receipt
  pointing at the old story.

Also left: `FormHelper`'s `included do` block (`form_helper.rb:121-124`) and
the unported `AtomFeedHelper`, `FormOptionsHelper`, `TranslationHelper` in
`packages/actionview/src/helpers.ts`.

## Acceptance criteria

- `SanitizeHelper::ClassMethods` and `UrlHelper::ClassMethods` reach `Base`
  through the Concern's `extend`; `base.ts` drops its hand `extend`.
- The sanitizer memos live on the including class; `stripTags` / `stripLinks`
  read `this.constructor`'s sanitizers as `self.class` does.
- `getSanitizerVendor`'s receipt is repointed or removed.
- Built `dist` modules still import cleanly as plain-node entry modules.

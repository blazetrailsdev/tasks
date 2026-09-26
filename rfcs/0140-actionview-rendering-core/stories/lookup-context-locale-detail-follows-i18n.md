---
title: "lookup-context-locale-detail-follows-i18n"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
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

`MissingTemplate#initialize` renders `details.inspect`
(`actionview/lib/action_view/template/error.rb:63`); Rails' details values are
Symbol arrays, so the locale renders `:locale=>[:en]`. trails#8134 converged
`:formats` and `:handlers` (the `handlers` detail default in
`packages/actionview/src/lookup-context.ts` and `PathParser#parse` in
`packages/actionview/src/template/resolver.ts` now spell `":tse"`), but the
locale half is still bare: trails renders `:locale=>["en"]`.

The locale detail is not a spelling-only change, because it crosses the I18n
boundary:

- Rails' `register_detail(:locale)` (`actionview/lib/action_view/lookup_context.rb:43-49`)
  builds `[I18n.locale, *I18n.fallbacks[I18n.locale], I18n.default_locale].uniq`;
  trails hardcodes `registerDetail("locale", () => ["en"])`.
- Rails' `LookupContext#locale=` (`lookup_context.rb:290-297`) writes
  `I18n.config.locale = value` and then resets the detail to `default_locale`;
  trails' `set locale` (`lookup-context.ts`) stores `[value]` directly.
- `PathParser#parse` (`resolver.rb:36-46`) spells the parsed locale
  `match[:locale]&.to_sym`; trails' `parse` leaves it bare, and must change in
  the same PR as the detail so `TemplateDetails#matches` still lines up.
- trails' I18n (`packages/i18n`) spells locales as bare strings (`"de"`), so
  `lookupContext.locale` / `Base#locale` / `ActionView::ViewPaths#locale`
  readers (asserted bare in `base.test.ts` and `view-paths.trails.test.ts`)
  need a decision about where the Symbol spelling starts.

## Acceptance criteria

- `register_detail(:locale)` and `LookupContext#locale=` are ported against
  trails' I18n, as `lookup_context.rb:43-49,290-297` does.
- The parsed and requested locale details use one spelling, and a
  `MissingTemplate` message renders `:locale=>[:en]` as Rails does.
- The spelling boundary with `packages/i18n` is stated in the PR and applied
  consistently to the locale readers.

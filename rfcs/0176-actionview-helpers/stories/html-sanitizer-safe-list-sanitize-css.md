---
title: "html-sanitizer-safe-list-sanitize-css"
status: draft
updated: 2026-10-17
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

`ActionView::Helpers::SanitizeHelper#sanitize_css`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/sanitize_helper.rb:122-124`) calls
`self.class.safe_list_sanitizer.sanitize_css(style)`. rails-html-sanitizer's
`SafeListSanitizer#sanitize_css` (`Loofah::HTML5::Scrub.scrub_css`) has no trails port:
`packages/html-sanitizer/src/safe-list-sanitizer.ts` defines only `sanitize`, so
`packages/actionview/src/helpers/sanitize-helper.ts`'s `sanitizeCss` raises a `TypeError`
with the default vendor, and the `Sanitizer` interface keeps `sanitizeCss` optional.

## Acceptance criteria

- `SafeListSanitizer#sanitizeCss` exists in html-sanitizer, following Loofah's `scrub_css`.
- The `Sanitizer` type's `sanitizeCss` is required for the safe-list sanitizer and
  `sanitize-helper.ts` drops its `!`.

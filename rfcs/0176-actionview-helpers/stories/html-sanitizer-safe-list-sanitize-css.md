---
title: "html-sanitizer-safe-list-sanitize-css"
status: blocked
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-17T22:02:38Z"
assignee: "distance-of-time-in-words-drops-invented-defaults"
blocked-by: "Loofah::HTML5::Scrub.scrub_css and Crass (its CSS parser) are not vendored (no vendor/loofah, vendor/crass, vendor/rails-html-sanitizer); vendor them first so the port can cite and mirror the source"
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

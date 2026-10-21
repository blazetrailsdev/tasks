---
title: "Seat sanitized_allowed_*= writers in the rails-html-sanitizer.rb mirror"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 14
pr: trails#9193
claim: "2026-10-21T21:16:17Z"
assignee: "sanitized-allowed-writers-live-in-rails-html-sanitizer-mirror"
blocked-by: null
closed-reason: null
---

## Context

trails#9105 ported rails-html-sanitizer's reopened `ActionView::Helpers::SanitizeHelper::ClassMethods#sanitized_allowed_tags=` / `#sanitized_allowed_attributes=` (`vendor/rails-html-sanitizer/v1.6.2/lib/rails-html-sanitizer.rb:24-36`) as `setSanitizedAllowedTags` / `setSanitizedAllowedAttributes` in `packages/actionview/src/helpers/sanitize-helper.ts`. They are defined in the gem's file, which the parity manifest does not cover (`PACKAGES_OUTSIDE_MANIFEST` in `scripts/api-compare/config.ts`), so `pnpm parity:api:extra --package actionview` lists both as novel surface on `sanitize-helper.ts`. The rest of that gem file (`:38-...`, the `protocol_separator` etc. deprecated writers) is unported.

## Acceptance criteria

- [ ] The writers live in the html-sanitizer package's mirror of `lib/rails-html-sanitizer.rb`, reopening actionview's `ClassMethods`, or the gem is brought into the parity manifest so they are credited.
- [ ] `parity:api:extra --package actionview` no longer reports them for `sanitize-helper.ts`.

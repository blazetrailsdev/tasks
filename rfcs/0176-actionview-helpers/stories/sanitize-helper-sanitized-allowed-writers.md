---
title: "sanitize-helper-sanitized-allowed-writers"
status: draft
updated: 2026-10-18
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

`vendor/rails/v8.0.2/actionview/test/template/sanitize_helper_test.rb:263-285`
(`test_sanitized_allowed_tags_is_settable`, `test_sanitized_allowed_attributes_is_settable`)
call `@subject_class.sanitized_allowed_tags = [...]` / `sanitized_allowed_attributes = [...]`.
Those writers are not in `actionview/lib/action_view/helpers/sanitize_helper.rb`
(its `ClassMethods` has only the readers, `:162-186`); rails-html-sanitizer reopens
`ActionView::Helpers::SanitizeHelper::ClassMethods` to add them, writing through to
`sanitizer_vendor.safe_list_sanitizer.allowed_tags=` / `allowed_attributes=`.
trails' `packages/actionview/src/helpers/sanitize-helper.ts` `ClassMethods` has
`sanitizedAllowedTags()` / `sanitizedAllowedAttributes()` and no writers; rails-html-sanitizer is
not vendored. The two tests are parked `it.skip` in
`packages/actionview/src/template/sanitize-helper.test.ts` (×3 vendor suites) under
`// BLOCKED: sanitize-helper-sanitized-allowed-writers`.

## Acceptance criteria

- Vendor rails-html-sanitizer (or cite its source) and port the two writers at their Rails names.
- Un-skip the two tests in all three vendor describes, restoring the saved value in `finally` as Rails' `ensure` does.

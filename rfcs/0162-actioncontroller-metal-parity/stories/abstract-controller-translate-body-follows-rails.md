---
title: "AbstractController::Translation#translate follows Rails' single-call body"
status: in-progress
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8755
claim: "2026-10-10T13:09:37Z"
assignee: "relation-index-read-on-an-unloaded-relation-answers-undefined"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/abstract-controller/translation.ts` became a `Module`
that `ActionController::Base` includes (trails#8639), but `translate`'s body was
moved as it was and does not follow
`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/translation.rb:17-32`.

Rails, for a key starting with `.`, builds `defaults = [:"#{path}#{key}"]`,
appends `options[:default]`, sets `options[:default] = defaults.flatten`,
rewrites `key` to `"#{path}.#{action_name}#{key}"`, HTML-escapes String defaults
when `html_safe_translation_key?(key)`, and makes one
`ActiveSupport::HtmlSafeTranslation.translate(key, **options)` call.

trails instead has a nil-key arm, looks up the scoped key and the fallback key
with two separate calls, walks `default` by hand, detects a miss by matching the
`"Translation missing:"` string (`isMissing`), raises `MissingTranslationData`
itself, and switches between `HtmlSafeTranslation.translate` and
`I18n.translate`. `htmlEscapeDefault` and `isMissing` are helpers Rails does not
have. `l` repeats `localize`'s body where Rails has `alias :l :localize` (`:39`).

## Acceptance criteria

- `translate` is Rails' body line for line: one `defaults` array carrying the
  `":path.key"` Symbol-shaped fallback, one `HtmlSafeTranslation.translate`
  call, no hand-rolled miss detection.
- `htmlEscapeDefault` and `isMissing` are gone.
- `packages/actionpack/src/abstract-controller/translation.test.ts` stays green.

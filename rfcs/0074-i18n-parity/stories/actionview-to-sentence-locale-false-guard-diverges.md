---
title: "Drop the locale: false guard ActionView's to_sentence does not have"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6042
claim: "2026-08-04T01:55:53Z"
assignee: "actionview-to-sentence-locale-false-guard-diverges"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/helpers/output-safety-helper.ts:119-132` (shipped in
PR #6040) guards the `support.array` lookup with `if (options.locale !== false)`.
Rails' `actionview/lib/action_view/helpers/output_safety_helper.rb:50` has **no**
such guard — it guards only on `defined?(I18n)` and passes `options[:locale]`
straight into `I18n.translate`. The guard was carried over from the
ActiveSupport twin at
`activesupport/lib/active_support/core_ext/array/conversions.rb:68`, where it is
real, and was required by the originating story's acceptance criteria.

In the i18n gem, `I18n.translate` does `locale ||= config.locale`
(`i18n/lib/i18n.rb`), so a Ruby caller passing `locale: false` to the ActionView
helper silently gets the _default_ locale's connectors — our port of that line
(`packages/i18n/src/i18n.ts:238`) already matches. So the trails guard changes
observable behaviour relative to Rails.

## Acceptance criteria

- Confirm the behaviour against `vendor/rails` (ActionView `to_sentence` with
  `locale: false` uses `I18n.locale`'s connectors, unlike `Array#to_sentence`).
- Drop the `options.locale !== false` branch from
  `output-safety-helper.ts` so the body matches
  `output_safety_helper.rb:50-53` line for line, and remove the call-site
  comment justifying it.
- Update the `to_sentence skips the I18n lookup for locale: false` case in
  `packages/actionview/src/template/output-safety-helper.trails.test.ts` to the
  Rails behaviour (or delete it).
- Keep the `assert_valid_keys` guard and the merge order untouched.

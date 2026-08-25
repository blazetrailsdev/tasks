---
title: "Port Backend::Base#localize and translate_localization_format"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-facade-translate-interpolate"]
deps-rfc: []
est-loc: null
priority: null
pr: 6004
claim: "2026-08-03T18:36:42Z"
assignee: "i18n-backend-localize"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/backend/base.ts` now ports every member of
`I18n::Backend::Base` except `localize` and `translate_localization_format`,
which were split out of `i18n-backend-file-loading-localize` (PR shipping the
translation-file lane) because both go through the `I18n.t` / `I18n.t!` facade
that is not ported yet.

- `vendor/i18n/lib/i18n/backend/base.rb:77-92` — `localize`: returns
  `options[:default]` for a nil object, raises `ArgumentError` unless the object
  responds to `strftime`, resolves a Symbol `format` through
  `I18n.t(:"#{type}.formats.#{key}", raise: true, object:, locale:)` where
  `type` is `time` when the object responds to `sec` and `date` otherwise, then
  calls `translate_localization_format` and `object.strftime(format)`.
- `vendor/i18n/lib/i18n/backend/base.rb:268-288` —
  `translate_localization_format`: gsubs `/%(|\^)[aAbBpP]/` against
  `date.abbr_day_names` / `date.day_names` / `date.abbr_month_names` /
  `date.month_names` / `time.am` / `time.pm` via `I18n.t!`, upcasing for the
  `^` and `%p` forms and downcasing for `%P`, and rescues
  `MissingTranslationData` by returning `e.message`.

`object` is duck-typed in the gem (`strftime`, `wday`, `mon`, `hour`, `sec`), so
this needs no dependency on activesupport's `TimeWithZone` — port against the
same duck type.

## Blocked on

`i18n-facade-translate-interpolate`. `translate_localization_format`'s
`rescue MissingTranslationData` arm only exists because `I18n.t!` dispatches
through the facade's `raise: true` exception handler; reimplementing that
against `config().backend.translate` directly would bake in a workaround the
facade story then has to unpick.

## Acceptance criteria

- `localize` and `translate_localization_format` land on `Backend::Base` with
  the gem's control flow, branch order and error messages.
- Symbol `format` resolution picks `time.formats.*` vs `date.formats.*` off the
  object's shape, as base.rb:83 does.
- The `%a %^a %A %^A %b %^b %B %^B %p %P` arms are all covered, including the
  `MissingTranslationData` rescue returning the message.

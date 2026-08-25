---
title: "i18n-share-one-ruby-date-across-fallbacks-tests"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6057
claim: "2026-08-04T13:47:42Z"
assignee: "i18n-share-one-ruby-date-across-fallbacks-tests"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/backend/fallbacks.test.ts:35-70` still defines its own
`RubyDate` / `RubyTime` stand-ins with a hand-rolled `strftime`, duck-typing
what `I18n::Backend::Base#localize` asks for (`strftime`, `wday`, `mon`, and
`sec` to pick `time.formats` over `date.formats` —
`i18n/lib/i18n/backend/base.rb:105-115`, ported at
`packages/i18n/src/backend/base.ts:340`).

PR #6053 (story `i18n-share-one-ruby-date-across-localization-tests`) retired
the same doubles from `packages/i18n/src/backend/localization.test.ts` and
`packages/activesupport/src/i18n.test.ts` by landing one shared
`packages/i18n/src/date.ts` (`Date`, `DateTime`) and
`packages/i18n/src/time.ts` (`Time`). `fallbacks.test.ts` was out of that
story's scope, so it is the last copy left.

Callers to convert: `fallbacks.test.ts:248` (`new RubyTime(2010, 1, 3)`) and
`:370`, `:374`, `:378`, `:382` (`new RubyDate(2010, 1, 3)`).

## Acceptance criteria

- `packages/i18n/src/backend/fallbacks.test.ts` defines no `RubyDate` /
  `RubyTime` class; the cases drive `Date` from `../date.js` and `Time` from
  `../time.js` (`Time.utc(...)`, since the constructor is private).
- Test names unchanged — they mirror `i18n/test/backend/fallbacks_test.rb`.
- No new stand-in members: if a case needs a directive `strftime` in
  `date.ts` does not answer yet, add it there with the Ruby spelling.

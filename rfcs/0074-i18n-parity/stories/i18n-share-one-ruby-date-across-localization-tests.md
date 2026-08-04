---
title: "Converge the i18n localization test's RubyDate double onto a real Date"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6053
claim: "2026-08-04T12:38:38Z"
assignee: "i18n-share-one-ruby-date-across-localization-tests"
blocked-by: null
closed-reason: null
---

# Converge the i18n localization test's RubyDate double onto a real Date

## Context

`packages/i18n/src/backend/localization.test.ts:14-62` defines a `RubyDate`
class (and a `RubyTime` subclass) standing in for Ruby's `::Date`/`::Time`,
with a hand-rolled `strftime`. It exists because
`I18n::Backend::Base#localize` duck-types its object — it asks for `strftime`,
`wday` and `mon`, and picks `date.formats` over `time.formats` by the _absence_
of `sec` (`i18n/lib/i18n/backend/base.rb:105-115`, ported at
`packages/i18n/src/backend/base.ts:245-271`) — and no real object satisfied the
date arm.

PR #6035 removed the sibling copy of that double from
`packages/activesupport/src/i18n.test.ts` by adding
`packages/activesupport/src/date.ts`: Ruby stdlib `::Date` over a
`Temporal.PlainDate`, carrying `parse`, `year`, `mon`, `month`, `day`, `wday`
and `strftime`, and deliberately omitting `sec`/`hour` so `localize` resolves
`date.formats`.

The `packages/i18n` copy could not be converged in that PR: `packages/i18n` is
a _dependency_ of `packages/activesupport`, so it cannot import `Date` from it.

## Converged shape

One `Date` (and, if the time-side double is also retired, one `Time`-shaped
analogue) that both packages use, which means moving `date.ts` to a package
`packages/i18n` may depend on — or to `packages/i18n` itself, since Ruby's
`::Date` is stdlib rather than activesupport's to own. Then delete `RubyDate`
/ `RubyTime` from `localization.test.ts` and drive those cases through it.

Note `packages/activesupport/src/date.ts` is tagged
`@noRailsEquivalent PERMANENT` — Rails never defines `::Date`, it only reopens
it in `activesupport/lib/active_support/core_ext/date/*.rb` (whose calculations
already live in `time-ext.ts`). Wherever the class lands, that stays true;
the point of this story is one copy rather than two, not removing the tag.

## Acceptance criteria

- `packages/i18n/src/backend/localization.test.ts` no longer defines its own
  `RubyDate`/`RubyTime` stand-ins; the localization cases drive a shared
  `Date`.
- No package-graph inversion: whatever holds the shared `Date` is a dependency
  of both `packages/i18n` and `packages/activesupport`, not the reverse.
- Test names unchanged (they mirror the gem's conformance mixins,
  `i18n/lib/i18n/tests/localization/date.rb` and `.../time.rb`).

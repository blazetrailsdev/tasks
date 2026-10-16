---
title: "DateHelper#distance_of_time_in_words translates through I18n, drops invented default table"
status: draft
updated: 2026-10-16
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8994 added `packages/actionview/src/locale/en.ts` (mirror of `vendor/rails/v8.0.2/actionview/lib/action_view/locale/en.yml`)
registered on the I18n load path from `action-view.ts` (`action_view.rb:102-104`), so `datetime.distance_in_words.*` now
resolves through I18n. But `packages/actionview/src/helpers/date-helper.ts` still carries an invented
`DEFAULT_DISTANCE_IN_WORDS` table plus `lookupTranslation` / `translateDistance` helpers and a `[missing: …]` fallback.
Rails `distance_of_time_in_words` (`date_helper.rb:95-150`) does
`I18n.with_options locale: options[:locale], scope: options[:scope] do |locale| … locale.t :x_minutes, count: … end`
with no local defaults. `normalize_distance_of_time_argument_to_time` (`date_helper.rb:699-707`) is also a typeof ladder
rather than Rails' `Numeric` / `Time` / `respond_to?(:to_time)` arms.

## Acceptance criteria

- [ ] `distanceOfTimeInWords` translates via `I18n.translate(key, { count, locale, scope })` with Rails' scope default; `DEFAULT_DISTANCE_IN_WORDS`, `lookupTranslation`, `translateDistance` deleted.
- [ ] `normalizeDistanceOfTimeArgumentToTime` mirrors `date_helper.rb:699-707` arm for arm.
- [ ] Existing distance-in-words tests stay green.

---
title: "distance-of-time-in-words-drops-invented-defaults"
status: in-progress
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9013
claim: "2026-10-17T22:02:38Z"
assignee: "distance-of-time-in-words-drops-invented-defaults"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/helpers/date-helper.ts` `translateDistance` passes `default: null`, falls back to an invented `DEFAULT_DISTANCE_IN_WORDS` table and a `[missing: ...]` string, and its `t` passes `count = 1` even for keys Rails calls without count (`half_a_minute`). Rails `distance_of_time_in_words` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:95-140`) is just `I18n.with_options locale:, scope:` + `locale.t key, count:` against the locale file, with no default.

## Acceptance criteria

- `DEFAULT_DISTANCE_IN_WORDS`, `translateDistance`'s `default: null` and the `[missing:]` arm are removed; translation relies on the actionview `en` locale.
- `half_a_minute` is translated without `count`.
- date-helper tests stay green.

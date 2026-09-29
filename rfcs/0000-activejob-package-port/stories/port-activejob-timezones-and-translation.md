---
title: "Port ActiveJob::Timezones and ActiveJob::Translation with timezones_test.rb and translation_test.rb"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-callbacks", "converge-usezone-and-withlocale-to-restore-on-settle"]
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/timezones.rb` (13 lines): `around_perform { |job, block| Time.use_zone(job.timezone, &block) }`.
`vendor/rails/v8.0.2/activejob/lib/active_job/translation.rb` (13 lines): `around_perform { |job, block| I18n.with_locale(job.locale, &block) }`.
`Base` gains `include Timezones` / `include Translation` (`base.rb:74-75`).

Fixtures: `test/jobs/timezone_dependent_job.rb` (22 lines) and
`translated_hello_job.rb` (12).

`vendor/rails/v8.0.2/activejob/test/cases/timezones_test.rb`: 2 cases, as `parity:test` names them:

- [ ] `:11` TimezonesTest — "it performs the job in the given timezone"
- [ ] `:25` TimezonesTest — "perform_now passes down current timezone to the job"

`vendor/rails/v8.0.2/activejob/test/cases/translation_test.rb`: 1 case, as `parity:test` names them:

- [ ] `:17` TranslationTest — "it performs the job in the given locale"

## Fidelity traps (predicted at authoring)

- [ ] `job.timezone` may be `nil` (no `Time.zone` at initialize). `Time.use_zone(nil)` is legal: `find_zone!` returns a falsy argument unchanged (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/zones.rb:81-82`), so the job runs under `zone_default`. Do not substitute a zone.
- [ ] `job.locale` is a String (`I18n.locale.to_s` at serialize); `I18n.with_locale` accepts it.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`.
- [ ] The 3 cases pass in all lanes.

## Definition of done

Setting the zone/locale outside the `around_perform` (e.g. in `perform_now`) does not close this story.

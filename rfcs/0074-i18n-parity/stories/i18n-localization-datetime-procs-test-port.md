---
title: "i18n-localization-datetime-procs-test-port"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6025
claim: "2026-08-03T21:20:10Z"
assignee: "i18n-localization-datetime-procs-test-port"
blocked-by: null
closed-reason: null
---

## Context

PR #6004 ported `lib/i18n/tests/localization/date.rb` and
`lib/i18n/tests/localization/time.rb` into
`packages/i18n/src/backend/localization.test.ts`. Two of the four Localization
conformance mixins `i18n/test/api/simple_test.rb:19-23` includes are still
unported:

- `vendor/i18n/lib/i18n/tests/localization/date_time.rb` — the same format /
  day-name / month-name / meridian arms against a `::DateTime` receiver.
- `vendor/i18n/lib/i18n/tests/localization/procs.rb` — `localize` where a
  `date.formats.*` entry is a Proc, which `Backend::Base#resolve`
  (`vendor/i18n/lib/i18n/backend/base.rb:230-240`) calls with the object.
  This is the arm that exercises the `options[:object]` handoff `localize`
  sets at `base.rb:85`.

`localization.test.ts` already carries the `RubyDate` / `RubyTime` duck-type
stubs both mixins need.

## Acceptance criteria

- Both mixins ported into `packages/i18n/src/backend/localization.test.ts`
  with the gem's test names verbatim.
- The Procs arms pass against the shipped `resolve`, or the gap they expose is
  filed as its own convergence story.

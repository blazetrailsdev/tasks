---
title: "date-and-time-calculations-predicates-and-day-arithmetic"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6452
claim: "2026-08-13T02:16:50Z"
assignee: "writer-resolves-to-set-name-when-reader-claims-bare"
blocked-by: null
closed-reason: null
---

## Context

Slot A of audit `activesupport-ar-gaps-20260810T143915Z.md`. The `DateAndTime::Calculations` mixin (`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb`, 63 members) has no TS file; the compare also counts its Time copy against `core_ext/object/blank.rb` (67 missing there, rubyModule Time) and its Date copy against `core_ext/date/acts_like.rb` (66) — the mixin + wiring credits all three buckets (~250 members total across A+B).

This slot: the predicates and day arithmetic — `yesterday`, `tomorrow`, `today?`, `tomorrow?`, `next_day?`, `yesterday?`, `prev_day?`, `past?`, `future?`, `on_weekend?`, `on_weekday?`, `before?`, `after?`, `days_ago`, `days_since`, `beginning_of_day` family. New file `packages/activesupport/src/core-ext/date-and-time/calculations.ts`, wired onto Date/Time/DateTime via the settled mixin idiom (this-typed functions / include()). Reuse `@blazetrails/date` logic where it exists — the parity credit needs the members at the AS paths, not a reimplementation.

AR call-site evidence: `change` 11 sites, `ago` 4 in AR/AM lib.

## Acceptance criteria

- `pnpm parity:api` missing counts drop for `core_ext/date_and_time/calculations.rb` and the Time/Date attribution buckets; delta non-negative overall.
- Bodies mirror the Ruby (same guards, same decomposition); Ruby truthiness ported per CLAUDE.md.
- Tests mirror `vendor/rails/activesupport/test/core_ext/date_and_time_behavior.rb` shared examples for the covered members.

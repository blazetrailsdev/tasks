---
title: "assertions-activesupport-logging-tail"
status: draft
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of the `assertions-activesupport-cluster-tail-7` +
`assertions-activesupport-logging-and-notifications` bundle. That PR converged
`silence_logger_test.rb`, `deprecation/deprecators_test.rb`,
`deprecation/proxy_wrappers_test.rb`, `actionable_error_test.rb`,
`benchmarkable_test.rb`, `subscriber_test.rb`, the Filter/Silencer/MultipleSilencers
classes of `backtrace_cleaner_test.rb`, `executor_test.rb`'s
`callbacks share state`, and `clean_logger_test.rb`'s `format message`
(activesupport mark 854 / 1201 / 97 → 837 / 1169 / 96).

Still outstanding (`pnpm parity:test -- --assertions --missing --package activesupport`):

- From the logging story: `deprecation_test.rb`, `notifications_test.rb`,
  `broadcast_logger_test.rb`, `logger_test.rb`, `lazy_load_hooks_test.rb`,
  `tagged_logging_test.rb`, `notifications/instrumenter_test.rb`,
  `deprecation/method_wrappers_test.rb`, `error_reporter_test.rb`,
  `log_subscriber_test.rb`, `notifications/evented_notification_test.rb`,
  remaining `executor_test.rb` rows.
- `rescuable_test.rb`: needs `ActiveSupport::Rescuable` (`rescue_with_handler`,
  `rescue_handlers`, `vendor/rails/activesupport/lib/active_support/rescuable.rb`)
  ported so the `Stargate`/`CoolStargate` fixtures (`rescuable_test.rb:1-133`)
  can be mirrored; `module-ext.ts` `rescueFrom`/`handleRescue` store handlers per
  object, not per class.
- `clean_logger_test.rb`: `datetime format` needs `Logger::Formatter` with
  `datetime_format`; `nonstring formatting` needs `Logger#add` to `inspect` a
  non-String message (Ruby `Logger::Formatter#msg2str`), today `String(message)`.
- `backtrace_cleaner_test.rb` `should silence gems from the backtrace` /
  `should silence stdlib`: need the default gem/stdlib silencers
  (`backtrace_cleaner.rb`), the port's `BacktraceCleanerDefaultFilterAndSilencerTest`
  uses a bespoke local cleaner.
- Everything in the cluster-tail-7 table: `test_case_test.rb`, `callbacks_test.rb`,
  `number_helper_test.rb`, `cache/cache_store_setting_test.rb`,
  `json/decoding_test.rb`, `cache/stores/null_store_test.rb` (`xml_mini_test.rb`
  and the two `json/encoding_test.rb` rows stay LEAVE per that story).

## Acceptance criteria

- Each file above reports 0 assertion-count / kind / value mismatches in
  `pnpm parity:test -- --assertions --package activesupport` (LEAVE rows excepted).
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by the contribution.
- No test name changes. If larger than one PR, ship what fits and file the rest.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.

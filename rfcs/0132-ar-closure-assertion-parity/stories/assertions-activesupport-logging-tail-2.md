---
title: "assertions-activesupport-logging-tail-2"
status: closed
updated: 2026-09-17
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
closed-reason: "duplicate of assertions-activesupport-logging-tail, which stays open"
---

## Context

Remainder of `assertions-activesupport-logging-tail`, whose bundle PR converged
`notifications/evented_notification_test.rb`, most of `log_subscriber_test.rb`
and `error_reporter_test.rb`'s `assert_difference` / re-raise rows. Still
divergent (`pnpm parity:test -- --assertions --missing --package activesupport`):

- `deprecation_test.rb` (92), `notifications_test.rb` (43), `broadcast_logger_test.rb` (38),
  `logger_test.rb` (26), `lazy_load_hooks_test.rb` (24), `tagged_logging_test.rb` (20),
  `notifications/instrumenter_test.rb` (14), `deprecation/method_wrappers_test.rb` (12),
  remaining `executor_test.rb` rows.
- `test_case_test.rb` (70), `callbacks_test.rb` (43), `number_helper_test.rb` (29),
  `cache/cache_store_setting_test.rb` (13), `json/decoding_test.rb` (2).
- `rescuable_test.rb` (9): needs `ActiveSupport::Rescuable`
  (`vendor/rails/activesupport/lib/active_support/rescuable.rb`) ported per class;
  `module-ext.ts` `rescueFrom`/`handleRescue` store handlers per object.
- `clean_logger_test.rb` (3): `datetime format` needs `Logger::Formatter#datetime_format`;
  `nonstring formatting` needs `msg2str` inspect of non-String messages.
- `cache/stores/null_store_test.rb` (3): `local store strategy` / `local store repeated reads`
  need `Cache::Strategy::LocalCache#with_local_cache`
  (`vendor/rails/activesupport/lib/active_support/cache/strategy/local_cache.rb`), unported.
- `log_subscriber_test.rb` `event attributes`: `Event#cpu_time` / `#allocations` are
  constant 0 in `notifications/instrumenter.ts` (`nowCpu`/`nowAllocations`); Rails'
  JRuby arm (`log_subscriber_test.rb:288-294`) is the shape that fits.
- `error_reporter_test.rb` `#report assigns a backtrace if it's missing`,
  `#unexpected swallows errors by default`, `#unexpected accepts an error message`:
  `backtrace_locations` has no JS twin.
- `backtrace_cleaner_test.rb` gem/stdlib silencer rows.

## Acceptance criteria

- Each file above reports 0 count / kind / value mismatches, or carries a call-site
  comment where a Ruby-only protocol makes that impossible.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes.

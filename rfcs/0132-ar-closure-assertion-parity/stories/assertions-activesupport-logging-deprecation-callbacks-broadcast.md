---
title: "assertions-activesupport-logging-deprecation-callbacks-broadcast"
status: draft
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
closed-reason: null
---

## Context

These are the rows left after `assertions-activesupport-logging-tail`. That
PR converged `lazy_load_hooks_test.rb`, `notifications/instrumenter_test.rb`,
`deprecation/method_wrappers_test.rb` and `number_helper_test.rb`, and ported
`Instrumenter::LegacyHandle`, `NameError#receiver`, and `on_load`'s
`class_eval`/`instance_eval`/`yield:` arms. Measured with
`pnpm parity:test -- --assertions --missing --package activesupport`.

Test shapes only (the runtime exists):

- `deprecation_test.rb` (92 rows). The file-local helpers
  `assert_disallowed`, `assert_callbacks_called_with` and
  `with_rails_logger` still need porting.
- `notifications_test.rb` (43 rows).
- `test_case_test.rb` (70 rows).
- `callbacks_test.rb` (43 rows). `packages/activesupport/src/callbacks.test.ts`
  runs invented target objects and does not mirror Rails' `Person`,
  `PersonSkipper`, `ConditionalPerson` and other fixtures
  (`callbacks_test.rb:1-430`).

Runtime work needed first:

- `broadcast_logger_test.rb` (38 rows). `BroadcastLogger`
  (`packages/activesupport/src/broadcast-logger.ts`) extends `Logger`, has no
  `method_missing` dispatch (`broadcast_logger.rb`), spells its predicates as
  `"debug?"` getters, and has no `dup` / `initialize_copy`.
- `logger_test.rb` (26 rows) and `tagged_logging_test.rb` (20 rows): thread
  and fiber-local level, and broadcast silencing.
- `error_reporter_test.rb` (5 rows): `Exception#backtrace` /
  `backtrace_locations`.
- `log_subscriber_test.rb` `event attributes`: `Event#cpu_time` and
  `allocations` are hard-coded to 0.
- `rescuable_test.rb` (9 rows): `ActiveSupport::Rescuable`
  (`rescuable.rb`).
- `clean_logger_test.rb`: `Logger::Formatter#datetime_format` and `msg2str`.
- `backtrace_cleaner_test.rb`: the default gem and stdlib silencers.
- `cache/cache_store_setting_test.rb` (13 rows): `MemCacheStore` /
  `RedisCacheStore` are not in activesupport, so today's tests assert on
  `NullStore`.
- `cache/stores/null_store_test.rb`: `Cache::Strategy::LocalCache`
  (`with_local_cache`).
- `json/decoding_test.rb`: the define_method-generated "JSON decodes" rows.

## Acceptance criteria

- Each file above reports 0 count/kind/value mismatches, or is split further
  with its own story that carries the Rails `file:line`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.

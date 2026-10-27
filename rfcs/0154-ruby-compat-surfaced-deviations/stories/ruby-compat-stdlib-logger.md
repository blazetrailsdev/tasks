---
title: "Port stdlib Logger and Benchmark.realtime to ruby-compat; ActiveSupport::Logger extends it"
status: in-progress
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9373
claim: "2026-10-27T14:42:03Z"
assignee: "ruby-compat-stdlib-logger"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `ActiveSupport::Logger < ::Logger`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/logger.rb:8`); the parent
is Ruby's stdlib Logger (`vendor/ruby/v3.3.11/lib/logger.rb`,
`lib/logger/formatter.rb`, `lib/logger/severity.rb`, `lib/logger/log_device.rb`).
trails has no parent: `packages/activesupport/src/logger.ts` folds both classes
into one `Logger`, so stdlib surface (severity constants, `Logger::Formatter`,
`add`, `debug`/`info`/`warn`/`error`/`fatal`/`unknown`, the `debug?` family,
the `debug!` family, `level`, `datetime_format`, `formatter`, `format_message`,
`<<`, `close`) lives in activesupport.

Gems that depend only on stdlib Logger cannot use it without taking an
activesupport dependency: mini_magick's `configuration.rb:83`
(`Logger.new($stdout)`, `vendor/mini_magick/v5.2.0/lib/mini_magick/configuration.rb`)
is the one blocking `mini-magick-drop-codegen-shims-and-activesupport`.

Stdlib `Benchmark.realtime` (`vendor/ruby/v3.3.11/lib/benchmark.rb`, `realtime`)
is used by mini_magick's `shell.rb:46`; activesupport's `benchmark.ts` is the
core_ext variant with a `unit` argument.

## Acceptance criteria

- `packages/ruby-compat/src/logger.ts` (plus `logger/formatter.ts`,
  `logger/severity.ts`, `logger/log-device.ts` as stdlib lays them out) ports
  stdlib Logger at its Ruby names and citations, exported from ruby-compat.
- `ActiveSupport::Logger` is `class Logger extends` the ruby-compat Logger and
  keeps only what `active_support/logger.rb`, `logger_silence.rb` and
  `logger_thread_safe_level.rb` define (`logger_outputs_to?`,
  `normalize_sources`, silencer/`silence`, `local_level`, `SimpleFormatter`).
- `Benchmark.realtime` (stdlib) is ported in ruby-compat.
- Existing activesupport logger tests pass unchanged; parity:api deltas
  non-negative, no new extra surface.

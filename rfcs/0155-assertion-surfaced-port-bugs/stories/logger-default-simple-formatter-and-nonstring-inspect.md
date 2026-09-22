---
title: "logger-default-simple-formatter-and-nonstring-inspect"
status: draft
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced by `assertions-activesupport-loggers-cluster` (RFC 0132). Parked:

- `packages/activesupport/src/logger.test.ts` › `defaults to simple formatter`
  — Rails `logger_test.rb:99-102` asserts `assert_instance_of
ActiveSupport::Logger::SimpleFormatter, logger.formatter`; Rails'
  `Logger#initialize` does `@formatter ||= SimpleFormatter.new`
  (`activesupport/lib/active_support/logger.rb:33-36`). trails' `Logger`
  leaves `formatter` `null`.
- `packages/activesupport/src/clean-logger.test.ts` › `datetime format` —
  Rails `clean_logger_test.rb:18-24` sets `Logger::Formatter.new` with
  `datetime_format = "%Y-%m-%d"` and matches the stdlib format
  `D, [YYYY-MM-DD#pid] DEBUG -- : debug`. trails has no `::Logger::Formatter`.
- `packages/activesupport/src/clean-logger.test.ts` › `nonstring formatting` —
  Rails `clean_logger_test.rb:26-30` expects `an_object.inspect + "\n"`
  (`SimpleFormatter#call` → `msg2str`/inspect for non-String). trails writes
  `String(obj)` (`1,2,3,4,5`).

## Acceptance criteria

- [ ] `new Logger(out).formatter` is a `SimpleFormatter` instance.
- [ ] A stdlib-style `Logger.Formatter` with `datetimeFormat` exists.
- [ ] Non-string messages format via inspect.
- [ ] The three parked tests are un-skipped and pass.

---
title: "activesupport-logger-new-takes-shift-age-and-size"
status: draft
updated: 2026-10-23
rfc: "0101-activesupport-out-of-closure-surface"
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

`Bootstrap`'s `initialize_logger` (`vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb`) builds
`ActiveSupport::Logger.new(config.default_log_file, 1, config.log_file_size)` when `log_file_size` is set
(development and test set it to 100 MB, `railties/lib/rails/application/configuration.rb:327`). Ruby's
`::Logger#initialize(logdev, shift_age = 0, shift_size = 1048576, ...)` hands those to `Logger::LogDevice`, which rotates the file.

trails' `Logger` (`packages/activesupport/src/logger.ts:149`) takes only `(output, kwargs)`, so
`packages/trailties/src/application/bootstrap.ts` keeps the `logFileSize` branch but passes the file alone, receipted
`@missingRailsArgs new — CONVERGEABLE activesupport-logger-new-takes-shift-age-and-size`.

## Acceptance criteria

- `Logger`'s constructor takes Ruby's `shiftAge` / `shiftSize` positionals and a `LogDevice` rotates a file output past `shiftSize`.
- `initialize_logger`'s `logFileSize` arm passes `(file, 1, logFileSize)` and the receipt is removed.

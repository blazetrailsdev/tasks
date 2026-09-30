---
title: "initialize-logger-ports-only-the-first-arm"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

`packages/trailties/src/application/bootstrap.ts`'s `initialize_logger` ports only the
first arm of Rails' body (`vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb:34-66`).
As of trails#8281 it seeds `Trails.logger ??= this.config.logger ?? new NullLogger()` and
sets the level only when `config.logLevel` is defined.

Rails instead:

- builds `ActiveSupport::Logger.new(config.default_log_file[, 1, config.log_file_size])`
  when `config.logger` is unset, sets `logger.formatter = config.log_formatter`, and wraps
  it in `ActiveSupport::TaggedLogging` (`:36-42`);
- on a failure to open the file, rescues with a WARN-level `TaggedLogging(Logger.new(STDERR))`
  and logs the "Rails Error: Unable to access log file" warning (`:43-53`);
- if `Rails.logger` is already a `BroadcastLogger`, applies `config.broadcast_log_level`
  (`:56-59`); otherwise always sets
  `Rails.logger.level = ActiveSupport::Logger.const_get(config.log_level.to_s.upcase)`, then
  wraps it in `ActiveSupport::BroadcastLogger` with the same formatter, and reassigns
  `Rails.logger` (`:60-65`).

trails' `NullLogger` fallback, the `logLevel !== undefined` guard, and the missing broadcast
wrap are all deviations from that body. `Configuration#logLevel` / `logFormatter` /
`logFileSize` already exist (`packages/trailties/src/application/configuration.ts:69-72`),
and `BroadcastLogger` exists in `packages/activesupport/src/broadcast-logger.ts`.

## Acceptance criteria

- [ ] `initialize_logger` mirrors `bootstrap.rb:34-66` arm for arm: the default file logger with
      formatter + `TaggedLogging`, the STDERR rescue arm, the `BroadcastLogger` branch, and the
      unconditional `log_level` assignment followed by the broadcast wrap.
- [ ] `config.default_log_file` / `config.broadcast_log_level` are the Rails readers
      (`application/configuration.rb`) if not already present.
- [ ] The log-file write goes through async fs (no `node:*` imports).
- [ ] Tests cover each arm (`config.logger` preset, default file logger, unwritable path, preset `BroadcastLogger`).

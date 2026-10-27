---
title: "ruby-compat-logger-log-device-file-arms"
status: draft
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
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

`packages/ruby-compat/src/logger/log-device.ts` ports stdlib `Logger::LogDevice`
(`vendor/ruby/v3.3.11/lib/logger/log_device.rb`) for its IO arm only. Left out,
each receipted `CONVERGEABLE ruby-compat-logger-log-device-file-arms`:

- `include MonitorMixin` / `mon_initialize` and the `synchronize` blocks in
  `write`, `close`, `reopen` (`log_device.rb:12,17,33,54,66`). ruby-compat's
  `Monitor#synchronize` is async; `write` is synchronous.
- Log rotation: `include Period` (`period.rb`), `next_rotate_time`,
  `check_shift_log`, `lock_shift_log`, `shift_log_age`, `shift_log_period`
  (`log_device.rb:22-27,35-41,125-206`).
- `open_logfile` opens `File::WRONLY | File::APPEND` and falls to
  `create_logfile` (`CREAT | EXCL`, `flock`, `add_log_header`) on `ENOENT`
  (`log_device.rb:95-123`). ruby-compat `File.open` takes only a string mode,
  so the port opens `"a"` and never writes the header.
- `set_dev` checks `respond_to?(:close)` as well as `:write`
  (`log_device.rb:80`); the port drops it because existing callers pass
  write-only sinks.

## Acceptance criteria

- `File.open` accepts an integer mode (`rb_io_extract_modeenc`), and
  `open_logfile` / `create_logfile` / `add_log_header` are ported as written.
- Rotation and `Period` ported; a size-shift test mirrors Ruby's
  `test/logger/test_logdevice.rb`.
- `synchronize` and the `close` check converge or are ratified; every
  `CONVERGEABLE ruby-compat-logger-log-device-file-arms` receipt is gone.

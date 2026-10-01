---
title: "Thor::Shell::Terminal's dynamic width needs a backtick port with inherited stdin"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Shell::Terminal.dynamic_width_stty` / `dynamic_width_tput`
(`vendor/thor/v1.3.2/lib/thor/shell/terminal.rb:30-36`) run `` `stty size 2>/dev/null` `` and
`` `tput cols 2>/dev/null` ``. Ruby's backtick inherits the caller's stdin, so `stty` reads the
controlling terminal. `packages/trailties/src/thor/shell/terminal.ts` reaches them through
`getChildProcess().spawnSync` (`packages/ruby-compat/src/child-process-adapter.ts`), which pipes
stdin: `stty size` then fails with "Inappropriate ioctl for device" and answers `""`, and
`tput cols` falls back to the terminfo default. So `terminal_width` answers 80 on a real
terminal unless `THOR_COLUMNS` is set.

ruby-compat has no port of the backtick method (`rb_f_backquote`,
`vendor/ruby/v3.3.11/io.c:10585`); `process-adapter.ts`' private `stty` helper already spawns
with `stdio: [0, "pipe", "pipe"]`.

## Acceptance criteria

- [ ] ruby-compat ports the backtick method (`rb_f_backquote`, `io.c:10585`) over the child-process adapter with
      stdin inherited, running the command through the shell so `2>/dev/null` holds.
- [ ] `dynamicWidthStty` / `dynamicWidthTput` call it with Thor's two command strings.
- [ ] On a TTY, `terminalWidth()` answers the terminal's column count.

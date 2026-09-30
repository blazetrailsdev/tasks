---
title: "ruby-compat-noecho-windows-console-echo-input"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
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

`IO#noecho` (`vendor/ruby/v3.3.11/ext/io/console/console.c:633`) clears only echo through
`set_noecho`. On Windows that is the `console.c:289` arm, which clears `ENABLE_ECHO_INPUT` with
`SetConsoleMode` and keeps `ENABLE_LINE_INPUT` / `ENABLE_PROCESSED_INPUT`.

ruby-compat's Node process adapter (`packages/ruby-compat/src/process-adapter.ts`, `stty`) sets the
termios flags through `stty(1)` on fd 0. That covers POSIX terminals only (trails#8297). Node
exposes no `SetConsoleMode`: its `setRawMode` clears line input and processed input as well.
So a Windows console raises `Errno::ENOTTY`, and Thor's `ask(echo: false)`
(`vendor/thor/v1.3.2/lib/thor/line_editor/basic.rb:29`) fails there.

## Acceptance criteria

- [ ] On a Windows console, `stdin.noecho(block)` suppresses echo for the block and restores the
      saved console mode after it settles, without breaking line input or Ctrl-C.
      Ctrl-C must still interrupt, as `ENABLE_PROCESSED_INPUT` requires.
- [ ] No new third-party runtime dependency. If this needs line discipline over `setRawMode`
      (backspace, CR→LF, Ctrl-C → SIGINT), that emulation is scoped to the Windows arm, and a
      test drives it through a fake stream.

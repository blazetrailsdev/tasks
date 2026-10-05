---
title: "ruby-compat: noecho raises the real Errno from a failed termios call"
status: blocked
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-05T16:39:40Z"
assignee: "lazy-attribute-hash-ivar-types-admit-a-marshal-loaded-hash"
blocked-by: "Needs a decision on a native termios binding (a third-party runtime dep), which the story forbids without one. No dependency-free route gives the exact errno: Node exposes termios only as setRawMode (clears ICANON/ISIG/ICRNL, not echo alone) and has no node:ffi on Node 24; stty(1) never reports the errno number, only strerror text that varies by libc (glibc 'Input/output error', musl 'I/O error') and locale, and BSD/macOS stty discards it on a failed tcgetattr (errx 'stdin isn't a terminal'). A strerror-text table would be an approximation with a bare SystemCallError fallback, not the real errno."
closed-reason: null
---

## Context

`ttymode` (`vendor/ruby/v3.3.11/ext/io/console/console.c:334-383`) raises `rb_syserr_fail(error, 0)`
with the errno a failed `tcgetattr` / `tcsetattr` recorded. The result is the matching `Errno::`
class, with its `errno` set.

ruby-compat's Node adapter (`packages/ruby-compat/src/process-adapter.ts`, `stty`, trails#8297)
makes those calls through `stty(1)` in a child process. The errno never reaches the parent, so any
failure other than ENOTTY becomes a bare `SystemCallError` with `errno: null`, built from the text
`stty` wrote to stderr.

## Acceptance criteria

- [ ] A failed get or set of the terminal mode raises the `Errno::` subclass for the real errno,
      with `errno` set, as `rb_syserr_fail` does. This needs termios access in-process, or an
      errno the adapter can recover exactly.
- [ ] `ruby-compat/src/errno.ts` gains only the `Errno` classes a raise site names (README rule 1).
- [ ] No new third-party runtime dependency. If one is unavoidable, block this story on that
      decision.

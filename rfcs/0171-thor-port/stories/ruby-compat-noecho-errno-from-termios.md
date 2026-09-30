---
title: "ruby-compat: noecho raises the real Errno from a failed termios call"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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

---
title: "ruby-compat: noecho raises the real Errno from a failed termios call"
status: closed
updated: 2026-10-08
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
blocked-by: null
closed-reason: 'PERMANENT: Node exposes termios only as setRawMode and stty never reports the errno number, so ruby-compat raises a bare SystemCallError where Ruby raises the specific Errno class. A native termios binding is not taken on (trails CLAUDE.md § "Runtime facts Node does not expose").'
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

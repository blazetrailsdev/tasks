---
title: "ruby-compat: SignalException#signo (esignal_signo)"
status: draft
updated: 2026-11-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps:
  - signal-exception-esignal-init-integer-arm
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI's `SignalException` stores its signal number when it is built: `esignal_init` sets the `signo` ivar (`vendor/ruby/v3.3.11/signal.c:330-372`), and `SignalException#signo` (`esignal_signo`, `signal.c:381-385`) reads it back. `Interrupt` is built with `SIGINT` (`interrupt_init`, `signal.c:398-404`).

ruby-compat's `SignalException` (`packages/ruby-compat/lib/signal-exception.ts:11`) is a bare `Exception` subclass with no `signo`. So a caller that wants the signal has to parse `message`, and `Interrupt`'s message is `"Interrupt"`, not a signal name. The trails#10468 reviewer noted this: an in-process termsig check on a raised `SignalException` had to special-case `Interrupt` as `"INT"`.

## Acceptance criteria

- `SignalException` records `signo` as `esignal_init` does, from a signal name or number, and exposes `signo()` (`esignal_signo`).
- `Interrupt` answers `signo()` = 2 (`interrupt_init`).
- Land it together with, or after, `signal-exception-esignal-init-integer-arm`, which ports the constructor's number arm.

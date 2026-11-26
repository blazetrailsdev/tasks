---
title: "rb-syserr-fail-str-raises-errno-for-every-spawn-code"
status: done
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10773
claim: "2026-11-26T00:29:56Z"
assignee: "json-parse-skips-comments-in-one-pass-and-takes-options"
blocked-by: null
closed-reason: null
---

## Context

`rbSyserrFailStr` in `packages/ruby-compat/src/kernel-system.ts` maps a spawn error's `.code` onto `Errno`. A code with no class (`ELOOP`, `ENAMETOOLONG`, `ENOEXEC`, `ETXTBSY`, and others) rethrows Node's error, and an error with no code reads `unknown error - <command>`. MRI's `rb_syserr_fail_str` (`vendor/ruby/v3.3.11/process.c:4871,4894`) raises the matching `Errno` with `<strerror> - <command>`.

## Acceptance criteria

- `Errno` has a class for each code a spawn can report (`vendor/ruby/v3.3.11/error.c:2700-2737`).
- `rbSyserrFailStr` always raises an `Errno` class with MRI's message.
- The `@inventedArm throw` receipt on `rbSyserrFailStr` is removed.

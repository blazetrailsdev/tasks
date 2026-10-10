---
title: "ruby-compat: rb_exec_getargs ports rb_check_argv (arity, [program, argv0], NUL byte)"
status: draft
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing trails#8732, which ported the argv form of `Kernel#system`.
`rbExecargNew` (`packages/ruby-compat/src/process.ts`) reads a trailing Hash as
the options and a leading Hash as the env, then raises `TypeError` for any
remaining argument that is not a String. Three arms of `rb_check_argv`
(`vendor/ruby/v3.3.11/process.c:2469-2497`) are not ported:

- `rb_check_arity(argc, 1, UNLIMITED_ARGUMENTS)` (`:2475`): `rbExecargNew([])`
  answers `prog: undefined` where MRI raises `ArgumentError`.
- `rb_check_array_type(argv[0])` (`:2477-2485`): a two-element Array first
  argument is `[program, argv0]` (`system(["ls", "my-ls"], "-l")`), and any
  other length raises `ArgumentError "wrong first argument"`. The port raises
  `TypeError "no implicit conversion of Array into String"` for both.
- `StringValueCStr` (`:2493`): an argument holding a NUL byte raises
  `ArgumentError "string contains null byte"`.

No trails caller passes the Array form today (`Thor::Actions#run` and the three
`run_cmd` bodies pass Strings).

Supersedes the Array-form item of
`kernel-system-out-redirect-open-failure-and-hash-type-check`, whose other
items landed in trails#8732 (`out:` open failure is MRI's `Errno::ENOENT`; the
Hash check is `isPlainHash`; a non-String argument raises `TypeError`).

## Acceptance criteria

- [ ] `rbExecargNew([])` raises `ArgumentError` with MRI's arity message.
- [ ] A two-element Array first argument is carried as `[program, argv0]`
      through `ChildProcessAdapter#system` (Node `spawn`'s `argv0` option); any
      other length raises `ArgumentError "wrong first argument"`.
- [ ] An argument containing `"\0"` raises
      `ArgumentError "string contains null byte"`.
- [ ] Each arm has a case in `kernel-system.trails.test.ts`, checked against
      `ruby` 3.3.11.

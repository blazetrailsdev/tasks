---
title: "ruby-compat: Kernel#system reports an out: open failure as MRI does; rb_exec_getargs checks Hash type"
status: closed
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: out: open failure already matches MRI (Errno::ENOENT, ruby 3.3.11); the Hash check and TypeError landed in trails#8732; the Array form moved to rb-exec-getargs-ports-rb-check-argv"
---

## Context

Surfaced reviewing trails#8732, which ported the argv form of `Kernel#system`
(`packages/ruby-compat/src/kernel-system.ts`, `process.ts#rbExecargNew`,
`child-process-adapter.ts#system`).

Two gaps against MRI:

- `out: filename` is opened in the parent before the spawn
  (`File.open(options.out, "w")` in `child-process-adapter.ts`), so a path that
  cannot be opened rejects `rbFSystem` with the open's own error. MRI opens
  redirects while running the child (`rb_execarg_parent_start` /
  `run_exec_open`, `vendor/ruby/v3.3.11/process.c`), and `rb_f_system` answers
  `nil` when the child could not be executed (`process.c:4867-4875`).
- `rbExecargNew` reads any `typeof x === "object"` first or last argument as
  the env or options hash, which includes `null` and an Array. `rb_exec_getargs`
  (`process.c:2511-2538`) uses `rb_check_hash_type`, and an Array first argument
  is the `[cmdname, argv0]` form.

## Acceptance criteria

- [ ] `rbFSystem("true", { out: "/no/such/dir/f" })` answers what MRI's
      `system("true", out: "/no/such/dir/f")` does (verify with `ruby` 3.3.11),
      with a test.
- [ ] `rbExecargNew` takes a Hash only where `rb_check_hash_type` does, and the
      `[cmdname, argv0]` Array form is ported or raises as MRI does for an
      unsupported argument.

---
title: "ruby-compat: Kernel#system / Open3.capture2e always use /bin/sh -c; MRI execs a metacharacter-free command line directly"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
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

Surfaced by trails#8531. `rbFSystem` (`packages/ruby-compat/src/kernel-system.ts`) and
`Open3.capture2e` (`packages/ruby-compat/src/open3.ts`) hand every command line to
`/bin/sh -c` (`ChildProcessAdapter#system` / `#capture2e`,
`packages/ruby-compat/src/child-process-adapter.ts`).

MRI does not. `rb_exec_fillarg` (`vendor/ruby/v3.3.11/process.c`, reached from `rb_execarg_new`,
`:2767`) scans a single-string command line for shell metacharacters and reserved words; only
when it finds one does it set `use_shell` and run `proc_exec_sh` (`process.c:1760-1790`). A
plain command line is split on spaces and exec'd directly. So in Ruby `system("nonexistent")` is
`nil` (`rb_f_system`'s `data->error != 0` arm, `process.c:4867-4875`) and
`Open3.capture2e("nonexistent")` raises `Errno::ENOENT` (`lib/open3.rb:892`), where trails answers
`false` (exit 127) and `["sh: 1: nonexistent: not found\n", status]`.

`Thor::Actions#run` (`vendor/thor/v1.3.2/lib/thor/actions.rb:265-272`) turns that result into
`abort`, so the two differ only in the `nil` / raise arm, not in whether a failed command aborts.

## Acceptance criteria

- [ ] `rbExecargNew` (`packages/ruby-compat/src/process.ts`) decides `use_shell` as
      `rb_exec_fillarg` does, and a command line with no metacharacter is exec'd directly with its
      space-split argv.
- [ ] `rbFSystem("nonexistent-command")` is `null`, and `Open3.capture2e("nonexistent-command")`
      raises `Errno::ENOENT`; a trails test pins each, beside one for a metacharacter command line
      that still runs through `/bin/sh -c`.

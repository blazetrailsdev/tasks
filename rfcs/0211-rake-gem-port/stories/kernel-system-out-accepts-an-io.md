---
title: "rbFSystem out: accepts an IO, as rb_execarg_addopt does"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
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

`sh` forwards spawn options to `system`, and Rake's `test_sh_with_spawn_options`
passes an IO: `r, w = IO.pipe` then `sh RUBY, "echocommand.rb", out: w`
(`vendor/rake/v13.2.1/test/test_rake_file_utils.rb:184-192`). MRI's
`rb_execarg_addopt` accepts an IO as a redirect target
(`vendor/ruby/v3.3.11/process.c`).

ruby-compat's `rbFSystem` types the option as `{ out?: string }`
(`packages/ruby-compat/src/kernel-system.ts:21`), so the system adapter takes a
filename only, and `sh with spawn options`
(`packages/rake/src/test-rake-file-utils.test.ts:223`) writes to
`echocommand.out` instead of a pipe. `sh ... its full output is printed` has the
same root: it redirects to `both.txt` in the shell where Rake uses
`capture_subprocess_io`.

## Acceptance criteria

- `rbFSystem` and the system adapter accept an IO (`IO.pipe`'s writer) for `out:`.
- `sh with spawn options` uses `IO.pipe` as Rake's test does.
- The output-printed test uses captured subprocess output if the IO redirect makes that reachable; otherwise its deviation stays recorded at the test.

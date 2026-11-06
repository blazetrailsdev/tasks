---
title: "Rails::Command.with_argv uses Array#replace (rbAryReplace) and ARGV.dup"
status: in-progress
updated: 2026-11-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#9789
claim: "2026-11-06T16:17:50Z"
assignee: "test-helper-constant-row-loads-without-test-case"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command.with_argv` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:140-146`) is
`original_argv = ARGV.dup; ARGV.replace(argv); yield; ensure ARGV.replace(original_argv)`.
trails' `withArgv` (`packages/trailties/src/command.ts`) open-codes both replaces as
`rbArgv().splice(0, rbArgv().length, ...)`. ruby-compat now has `rbAryReplace` (trails#9737) and
ruby-compat's `rbObjDup` for `ARGV.dup`.

## Acceptance criteria

- [ ] `withArgv` reads `const originalArgv = rbObjDup(rbArgv())`, then `rbAryReplace(rbArgv(), argv)`, and restores with `rbAryReplace(rbArgv(), originalArgv)` in the `finally`.

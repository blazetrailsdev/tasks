---
title: "Port Rake::PackageTask#define's tar / zip archive bodies"
status: in-progress
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps:
  - "rake-package-task-accessors-and-tests"
  - "rake-file-utils-ext-flags-and-output-helpers"
deps-rfc: []
est-loc: 250
priority: 3
pr: trails#9969
claim: "2026-11-10T20:52:51Z"
assignee: "rake-package-task-define-archives"
blocked-by: null
closed-reason: null
---

## Context

`PackageTask#define` (`vendor/rake/v13.2.1/lib/rake/packagetask.rb`) builds the archive tasks,
whose bodies `chdir` into the package dir and `sh` the `tar_command` /
`zip_command` with `verbose` from `FileUtilsExt`. No gem test runs them, so a
`*.trails.test.ts` stubs `sh` and asserts the command lines, the way rake's own
tests stub shell-outs.

## Acceptance criteria

- [ ] The archive task bodies are ported line for line, calling `sh` and
      `verbose` through the ported `FileUtilsExt`.
- [ ] A trails test stubs `sh` and pins each archive command line; no `tar` or
      `zip` binary is needed on CI.

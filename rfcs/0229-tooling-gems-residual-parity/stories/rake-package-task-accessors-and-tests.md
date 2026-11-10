---
title: "Port Rake::PackageTask's accessors, initialize / init and naming, with test_rake_package_task.rb"
status: draft
updated: 2026-11-09
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rake/v13.2.1/lib/rake/packagetask.rb:1-222` (36 members: the `need_tar*` / `need_zip`
accessors, `package_files`, `tar_command`, `zip_command`, `without_parent_dir`,
`init`, `define`, `package_name`, `package_dir_path`, `tgz_file`, …) has no TS
file. `vendor/rake/v13.2.1/test/test_rake_package_task.rb` (7 tests: `test_initialize`,
`_no_version`, `_noversion`, `test_clone`, `test_package_name`,
`_noversion`, `test_without_parent_dir`, :7-81) checks the declared tasks and
names only; none runs `tar` or `zip`. This story ports everything but `define`'s
archive bodies.

## Acceptance criteria

- [ ] `packages/rake/lib/packagetask.ts` ports the accessors, `initialize`,
      `init`, `package_name`, `package_dir_path` and the `*_file` / `working_dir`
      readers at their Ruby names.
- [ ] `define` declares the tasks the tests assert on.
- [ ] `test/test-rake-package-task.test.ts` ports all 7 tests by name.

---
title: "Port Rake::PackageTask and test_rake_package_task.rb"
status: draft
updated: 2026-11-09
rfc: "0000-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps:
  - "rake-file-utils-ext-flags-and-output-helpers"
deps-rfc: []
est-loc: 550
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
file. `vendor/rake/v13.2.1/test/test_rake_package_task.rb` (7 tests) is unported. `define` shells
out to `tar` / `zip` through `sh`, which `packages/rake/lib/file-utils.ts` ports.

## Acceptance criteria

- [ ] `packages/rake/lib/packagetask.ts` ports every member at its Ruby name.
- [ ] `test/test-rake-package-task.test.ts` ports all 7 tests by name.

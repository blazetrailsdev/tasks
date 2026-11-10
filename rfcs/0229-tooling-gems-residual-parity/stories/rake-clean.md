---
title: "Port rake/clean.rb's Cleaner and test_rake_clean.rb"
status: draft
updated: 2026-11-09
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rake/v13.2.1/lib/rake/clean.rb:1-78` is 7/11 with no TS file at the convention path
(`packages/rake/lib/clean.ts`): `Cleaner#cleanup_files`, `cleanup`,
`file_already_gone?`, `cant_be_deleted?`, plus the `CLEAN` / `CLOBBER` file lists
and `clean` / `clobber` tasks. `vendor/rake/v13.2.1/test/test_rake_clean.rb` (7 tests) is
unported.

## Acceptance criteria

- [ ] `packages/rake/lib/clean.ts` ports the file, moving any members credited
      elsewhere today.
- [ ] `test/test-rake-clean.test.ts` ports all 7 tests by name.

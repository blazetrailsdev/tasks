---
title: "Port test_rake_test_task, rake_test_loader and makefile_loader tests"
status: draft
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rake/v13.2.1/test/test_rake_test_task.rb` (17 tests), `test_rake_rake_test_loader.rb` (4) and `test_rake_makefile_loader.rb` (1) are unported, though trails#9534 ported `packages/rake/src/testtask.ts`, `rake-test-loader.ts` and `loaders/makefile.ts`. `parity:test` shows all three files missing.

## Acceptance criteria

- [ ] All three test files are ported with Rails test names verbatim.

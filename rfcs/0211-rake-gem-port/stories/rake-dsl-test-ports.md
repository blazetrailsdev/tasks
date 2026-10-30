---
title: "rake-dsl-test-ports"
status: ready
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps:
  - rake-dsl-and-file-tasks
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `rake-dsl-and-file-tasks` for the 800 LOC ceiling. `Rake::DSL` is ported at `packages/rake/src/dsl-definition.ts`; these three ported, passing test files are on branch `wip/rake-dsl-tests`: `test-rake-dsl.test.ts`, `test-rake-definitions.test.ts`, `test-rake-directory-task.test.ts` (from `vendor/rake/v13.2.1/test/test_rake_dsl.rb`, `test_rake_definitions.rb`, `test_rake_directory_task.rb`). Start from it: `git checkout origin/wip/rake-dsl-tests -- <those files>`, then delete the branch. `can use filelist` stays `it.skip` for `rake-file-list-port`.

## Acceptance criteria

- [ ] The three test files are on main with names matching for `parity:test`.
- [ ] `wip/rake-dsl-tests` is deleted.

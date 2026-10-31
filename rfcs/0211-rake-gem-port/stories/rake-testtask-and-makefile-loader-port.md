---
title: "rake-testtask-and-makefile-loader-port"
status: done
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9534
claim: "2026-10-31T15:16:48Z"
assignee: "rake-testtask-and-makefile-loader-port"
blocked-by: null
closed-reason: null
---

## Context

`rake-exe-and-functional-tests` parked six `test_rake_functional.rb` tests in `packages/rake/src/test-rake-functional.test.ts` because their libraries are unported: `vendor/rake/v13.2.1/lib/rake/testtask.rb` with `rake_test_loader.rb` (`test_test_task_*`, `test_signal_propagation_in_tests`, `test_failing_test_sets_exit_status`) and `lib/rake/loaders/makefile.rb` (`test_imports`). Fixtures: `test/support/rakefile_definitions.rb:43-61,237-267,461-508`.

## Acceptance criteria

- [ ] `Rake::TestTask` and `Rake::MakefileLoader` are ported at their Rails paths.
- [ ] The six `it.skip` bodies are ported from `test_rake_functional.rb` with their fixtures.

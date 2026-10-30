---
title: "rake-rules-test-port"
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

`rake-task-manager-and-scope` ported `create_rule`, `enhance_with_matching_rule`, `attempt_rule`, `make_sources` and `ext/string.rb` (`packages/rake/src/task-manager.ts`, `ext/string.ts`), and six tests of `vendor/rake/v13.2.1/test/test_rake_rules.rb` in `packages/rake/src/test-rake-rules.test.ts`. The rest need `FileTask#needed?` / `timestamp` (`file_task.rb`; `file-task.ts` holds only `scope_name`), the `rule` / `file` DSL and `create_timed_files`. `FileTask#needed?` also makes `Task#isNeeded` async. The `did_you_mean` arm of `generate_did_you_mean_suggestions` (`task_manager.rb:68-79`) answers "" because rake depends on ruby-compat only.

## Acceptance criteria

- [ ] All remaining `test_rake_rules.rb` tests port as native Vitest with matching names.
- [ ] `Rake.application` seats the real `Rake::Application`, and the test `TestTaskManager` stand-in is reduced to `Rake::TestCase::TaskManager`.

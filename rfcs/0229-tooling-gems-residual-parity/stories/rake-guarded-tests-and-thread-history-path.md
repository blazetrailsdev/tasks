---
title: "Port rake's two platform- and version-guarded tests and move the thread-history test file"
status: done
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: trails#9948
claim: "2026-11-10T13:44:28Z"
assignee: "rake-guarded-tests-and-thread-history-path"
blocked-by: null
closed-reason: null
---

## Context

`test_rake_file_list.rb` "dup and clone replicate taint" (:500) sits under
`if RUBY_VERSION < "2.7"` (:498), so it never runs on Ruby 3, and
`test_rake_directory_task.rb` "directory win32" (:37) sits under
`if Rake::Win32.windows?`. `thread-history-display.test.ts` holds the 8
`test_thread_history_display.rb` tests at the wrong path
(`test-thread-history-display.test.ts`).

## Acceptance criteria

- [ ] Both tests are ported by name with the same guard as the Ruby:
      `skipIf` on the ported `RUBY_VERSION` comparison and on
      `Rake::Win32.isWindows()`. Neither is a `PERMANENT-SKIP`.
- [ ] `thread-history-display.test.ts` is `git mv`'d to the convention path;
      `pnpm parity:test --package rake` reports 0 misplaced.

---
title: "Accept a Rake::FileList directly as a task prerequisite"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rake passes a `FileList` straight to the DSL: `task a: FileList.new.include("b", "c")` (`vendor/rake/v13.2.1/test/test_rake_task.rb:248-251`), and `Task.format_deps` reads it through `respond_to?(:to_ary)` (`vendor/rake/v13.2.1/lib/rake/task.rb:372-375`). In trails `FileList#toAry` is async (`packages/rake/src/file-list.ts:233`) while `TaskManager#defineTask` is sync, so `rbCheckArrayType` raises. `test-rake-task.test.ts` awaits `toAry()` first, under a `BLOCKED:` line.

## Acceptance criteria

- [ ] A `FileList` passed directly as a prerequisite defines the task, its glob resolved no later than the first prerequisite read.
- [ ] "filelists can be prerequisites" passes the `FileList` itself and loses its `BLOCKED:` line.

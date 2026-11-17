---
title: "rake-timestamps-nanosecond-precision"
status: draft
updated: 2026-11-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
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

Rake's `Task#timestamp` is `Time.now` (`vendor/rake/v13.2.1/lib/rake/task.rb:292-294`), and `FileTask#timestamp` / `#needed?` read `File.mtime` (`vendor/rake/v13.2.1/lib/rake/file_task.rb`). Both have nanosecond precision in Ruby. In trails, `Task#timestamp` (`packages/rake/lib/task.ts:292`) and `File.mtimeAsync` (`packages/ruby-compat/lib/file.ts:959`) are millisecond `Date`s. A file touched by a prerequisite in the same millisecond compared equal to "now", so the file task was judged up to date (CI red red-7c34e78d, trails#10260). trails#10260 shipped `new Date(Date.now() + 1)` with `@inventedArm + — CONVERGEABLE` pointing here.

## Acceptance criteria

- `File.mtime` / `File.mtimeAsync` answer a sub-millisecond time (`stat` with `bigint: true`, `mtimeNs`), and `Task#timestamp` answers a sub-millisecond now, both through `Timestamp` / `cmp` (`file-task.ts` `isOutOfDate`, `_timeToS`, `EarlyTime` / `LateTime`).
- `Task#timestamp` is a bare "now", as in Rake; the `+ 1` and its receipt are removed.
- `test-rake-task.trails.test.ts`'s same-millisecond test stays green.

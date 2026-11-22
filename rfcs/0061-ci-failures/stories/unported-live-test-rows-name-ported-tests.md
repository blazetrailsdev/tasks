---
title: "parity: retire unported tests: rows that name live activesupport/activerecord tests"
status: in-progress
updated: 2026-11-22
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10550
claim: "2026-11-22T03:22:33Z"
assignee: "solid-cable-trim-job-limited-trim-flakes-on-pg"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-live-test.test.ts` > "no `tests:` entry names a live test
in the mirroring TS file" fails on main (seen while working trails#10527):

- `concurrency/load_interlock_aware_monitor_test.rb` rows exclude "entering with
  no blocking" / "entering with blocking", which
  `packages/activesupport/test/concurrency/load-interlock-aware-monitor.test.ts:17,21,65,69`
  define as live tests.
- `relation/load_async_test.rb` (class LoadAsyncTest) excludes "load async
  instrumentation is thread safe", live at
  `packages/activerecord/test/cases/relation/load-async.test.ts:168`.

## Acceptance criteria

- [ ] Each row is retired (with its `unported-files/baseline.json` row) if the test is really ported, or scoped with `className`.
- [ ] `pnpm vitest run scripts/parity/unported-live-test.test.ts` passes.

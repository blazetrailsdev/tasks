---
title: "leaked-chdir-block-cascades-after-test-timeout"
status: draft
updated: 2026-11-26
rfc: "0142-trailties-surfaced-deviations"
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

In trails#10801 (red-35a69743), one test, `AppGeneratorTest > application name is detected if it exists and app folder renamed`, hit vitest's timeout while it was inside `runAppUpdate`'s `Dir.chdir(appRoot, async () => …)` (`packages/trailties/test/generators/generators-test-helper.ts:129`). vitest abandoned the promise, but the chdir block's state never unwound. Every later test's teardown, `ensureCurrentPath` (`packages/trailties/lib/generators/testing/behavior.ts:95`) through `FileUtils.cd`, then raised `RuntimeError: conflicting chdir during another chdir block` (`packages/ruby-compat/lib/dir.ts:293`). One timeout became 145 failures.

In Ruby, a Minitest timeout raises inside the block, so `Dir.chdir`'s ensure clause restores the directory. A JS test timeout does not run the abandoned block's `finally`.

## Acceptance criteria

- A timed-out test that leaves a `Dir.chdir` block open does not red the teardown of every later test in the file. For example, the generator testing teardown or the per-test harness resets the leaked chdir state.
- Add a regression test that fails on the current code.

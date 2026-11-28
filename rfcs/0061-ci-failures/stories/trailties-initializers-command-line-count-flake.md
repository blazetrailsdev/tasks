---
title: "trailties-initializers-command-line-count-flake"
status: draft
updated: 2026-11-28
rfc: "0061-ci-failures"
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

`packages/trailties/test/commands/initializers.test.ts:40` ("`trails initializers` prints out defined initializers invoked by Trails", ported from `vendor/rails/v8.0.5.2/railties/test/commands/initializers_test.rb`) failed in CI on trails#10864, a pure version-bump PR whose base (172047d41d) was green on main:

    AssertionError: expected -32 to be 1
    ❯ packages/trailties/test/commands/initializers.test.ts:40:53

Run 46152831426, job 141003117379 (Trailties Tests (6)). The second `trails initializers` call printed 32 fewer lines than the first, so the first run's output carries ~32 lines of nondeterministic extra output (likely one-time boot noise such as schema-load `-- createTable` lines, which appear interleaved in the same shard's log) rather than only the initializer list. The test compares raw line counts, so any first-boot-only stdout makes it flaky.

## Acceptance criteria

- Identify the extra lines in the first `t.trails("initializers")` output and make the command (or the isolation app build) emit them deterministically, matching Rails, so both runs differ only by the added initializer.
- The test passes repeatedly (e.g. 20 consecutive local runs) without changing its name or assertions.

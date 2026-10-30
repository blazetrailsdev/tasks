---
title: "Land the fourth wip test and converge wip rake tests to Rails assertion kinds"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rake-dsl-test-ports` says three files, but `wip/rake-dsl-tests` also holds `test-rake-late-time.test.ts`. All four use Vitest-style matchers that the assertion ratchet reds: trails#9499 had to rewrite its siblings to Rails' kinds (`assert x` is `expect(x).toBeTruthy()`, `assert ! x` is `expect(!x).toBeTruthy()`, `assert a < b` is `expect(a < b).toBeTruthy()`, `assert_equal` is `toEqual`).

## Acceptance criteria

- [ ] The four files land from `wip/rake-dsl-tests` with `pnpm parity:test --package rake --assertions` reporting no mismatch.
- [ ] `cmp(...)` results in `test_rake_late_time` carry `!`, so `pnpm typecheck` passes.

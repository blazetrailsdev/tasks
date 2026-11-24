---
title: "CI: cut the per-test isolation child startup cost so the Trailties configuration leg fits in 8 minutes"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#10693, each heavy Trailties isolation file runs on its own CI leg, with `concurrent: true` and setup/teardown in the isolation child (`packages/trailties/test/application/{configuration,routing,mailer-previews,initializers/frameworks,middleware/exceptions,rake/multi-dbs}.test.ts`). The `configuration` leg is still ~11 min (657s on run 45325537677), above the 7–8 min target.

The cost is per test. `Isolation#run` (`packages/activesupport/lib/testing/isolation.ts:85-110`) spawns a fresh `vitest run <file> -t=^name$` for every test, and every child re-transforms the module graph: ~25s a child, of which the test body is ~3.6s (trails#10650 profile). The legs are CPU-bound on 4 vCPU, so adding concurrency no longer helps.

## Acceptance criteria

- Cut the per-child startup cost, for example by running the child on the built `dist/` instead of re-transforming through vitest, or by reusing a warm transform cache. Keep `-t` single-test selection and Ruby's fork-per-test isolation semantics.
- Measure the per-test child cost before and after on CI. `Trailties Tests (configuration)` drops under 8 min with no test skipped.

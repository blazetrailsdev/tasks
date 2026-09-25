---
title: "Narrow the void-return report to Rails callers that read the return value"
status: done
updated: 2026-09-25
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8098
claim: "2026-09-25T17:51:35Z"
assignee: "port-rails-test-help-for-applications"
blocked-by: null
closed-reason: null
---

## Context

trails#8006 shipped `pnpm parity:api:returns` (`scripts/api-compare/report-void-returns.ts`), which reports pairs whose TS port returns `void` / `Promise<void>` where the Rails body's final expression is a call, `.new` or `return <expr>`. A hand audit of 80 reproducibly sampled rows found 0 real and 1 plausible out of 710 rows, so the body-shape heuristic has no signal. The only real rows known are `establish_connection` (`activerecord/lib/active_record/connection_handling.rb:50-54`), plus the already-fixed `assert_not` (`activesupport/lib/active_support/testing/assertions.rb:20-23`), which was found because `test_case_test.rb:20-28` reads the return: `assert_equal true, assert_not(nil)`.

## Acceptance criteria

- Replace the body-shape filter with a caller-based one: a void-ported pair is reported only when a Rails body or Rails test uses the method's return value. That means an assignment RHS, a call argument, `assert_equal <x>, m(...)`, or a chained receiver, from the Ruby extractor's call-site data (`callArgs` / skeleton `ref:`s).
- Hand-audit a reproducible sample of at least 40 rows with per-row verdicts in the PR body. Recommend gating only if at least ⅔ are real (RFC 0113 tripwire).
- `establishConnection` still appears.

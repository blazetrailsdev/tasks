---
title: "Port ActiveSupport::Executor::TestHelper#run"
status: closed
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do (maintainer decision 2026-08-14): vitest owns the run and the helper has no caller in trails. ActiveSupport::Executor::TestHelper#run is Rails.application.executor.perform { super } (executor/test_helper.rb:4-6); Ruby resolves Rails at call time, ESM cannot, and activesupport cannot import trailties. Not routing it through a zero-import slot — the helper is not worth the seam. File afresh if a trails-side test runner ever needs the executor wrap."
---

## Context

`ActiveSupport::Executor::TestHelper` is a one-method module —
`def run(...)` wrapping `super` in
`ActiveSupport::Executor.perform` — at
`vendor/rails/activesupport/lib/active_support/executor/test_helper.rb:3-8`.
It is what runs each test inside an execution, so executor-registered hooks
(query cache, the async-queries tracker's session, connection-pool reaping)
apply to test bodies the way they apply to a request.

`pnpm parity:api --package activesupport --missing` reports
`executor/test_helper.rb` → `executor/test-helper.ts` at **0/1** (`run`); the TS
file is a placeholder with the method unported. It was unportable until
PR #6529 landed `ActiveSupport::Executor` and `ExecutionWrapper.perform`
(`packages/activesupport/src/execution-wrapper.ts`), which is exactly what the
module needs.

This is also the narrowest available answer to the session-lifecycle gap
tracked by `port-executor-wrapping-around-a-unit-of-work`: with `TestHelper`
ported and mixed into the test case, trails' own tests would get a query session
without hand-wiring `run!`/`complete!`, as `future-result.trails.test.ts` does
today.

## Acceptance criteria

1. `executor/test-helper.ts` ports `run` per `test_helper.rb:3-8` —
   `Executor.perform` around the superclass `run` — bringing the file to 1/1 on
   `pnpm parity:api --package activesupport --missing`.
2. The module composes with trails' `ActiveSupport::TestCase` the way Rails'
   `include` does (see CLAUDE.md "Module mixins"), without inventing a wrapper
   Rails does not have.
3. Enroll whatever of Rails' coverage applies; at minimum a test showing a body
   run through the helper has an open async-query session.
4. `packages/activerecord/src/future-result.trails.test.ts`'s hand-wired
   `runBang`/`completeBang` bracket is re-evaluated against the ported helper
   and simplified if the helper subsumes it.

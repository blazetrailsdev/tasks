---
title: "frameworks-test-runs-in-isolation-via-register-spec-type"
status: in-progress
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9845
claim: "2026-11-07T20:22:41Z"
assignee: "frameworks-test-runs-in-isolation-via-register-spec-type"
blocked-by: null
closed-reason: null
---

## Context

`frameworks_test.rb` includes `ActiveSupport::Testing::Isolation`
(`vendor/rails/v8.0.2/railties/test/application/initializers/frameworks_test.rb:7-9`), so every
test runs in its own forked process. trails'
`packages/trailties/src/application/initializers/frameworks.test.ts` includes `Isolation` but
never calls `registerSpecType(/^FrameworksTest$/, FrameworksTest)`. Because of that,
`activesupport/src/testing/autorun.ts`'s `beforeEach` does not route its `it` bodies through
`Isolation#run`, and the test runs in-process: 7s against the ~25s of the isolated siblings
`hooks.test.ts` / `load-path.test.ts`. A second boot in the same file would leak framework
state, such as `Configuration._toPrepareBlocks` and `Trails.application`.

## Acceptance criteria

- `frameworks.test.ts` calls `registerSpecType(/^FrameworksTest$/, FrameworksTest)`, as
  hooks.test.ts does, so each test runs in a child process.
- Grep `packages/trailties/src/**/*.test.ts` for any other class that includes `Isolation`
  without `registerSpecType`, and converge it the same way.

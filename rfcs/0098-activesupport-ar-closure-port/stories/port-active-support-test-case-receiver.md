---
title: "Port ActiveSupport::TestCase so the testing modules have Rails' include receiver"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6510
claim: "2026-08-14T09:57:07Z"
assignee: "weak-receiver-rows-residual-mixin-call-pairing"
blocked-by: null
closed-reason: null
---

## Context

`activesupport/lib/active_support/test_case.rb` is unported —
`pnpm parity:api` reports `test_case.rb -> test-case.ts  0/40  0%`, and no
`packages/activesupport/src/test-case.ts` exists.

That absence has a concrete cost, surfaced by PR #6494 (story
`emit-tagged-logging-per-test-heading`). Rails wires
`ActiveSupport::Testing::TaggedLogging`'s per-test heading through
`test_case.rb:144`:

```ruby
include ActiveSupport::Testing::TaggedLogging
prepend ActiveSupport::Testing::SetupAndTeardown
prepend ActiveSupport::Testing::TestsWithoutAssertions
include ActiveSupport::Testing::Assertions
...
```

With no `ActiveSupport::TestCase` to include into, PR #6494 installed
`beforeSetup()` from two vitest setup files instead —
`packages/activesupport/src/test-setup-test-case.ts` (the `other` project) and
`packages/activerecord/src/cases/helper.ts:38-44` (the AR project). Two
registration sites stand in for one Rails `include`, and every future module on
that list (`SetupAndTeardown`, `TestsWithoutAssertions`, `ErrorReporterAssertions`,
`ConstantStubbing`) faces the same choice with no shared answer.

The same gap is why the ported `testing/assertions.ts` helpers are free
functions reading `expect.getState().currentTestName` through
`_testCaseIdentity` (`packages/activesupport/src/testing/tagged-logging.ts`)
rather than reading `self.class` / `name` off a receiver.

## Converged shape

Port `test_case.rb` and give the testing modules the single receiver Rails
gives them, so the module list at `:144-151` is expressed once instead of
re-registered per vitest project. Retire
`packages/activesupport/src/test-setup-test-case.ts` and the `beforeEach` block
in `cases/helper.ts` in favour of that include chain.

Likely larger than one PR — split by module once the receiver exists; the
TaggedLogging include (test_case.rb:144) is the smallest first slice because its
behaviour is already ported and only its wiring is bespoke.

## Acceptance criteria

- [ ] `ActiveSupport::TestCase` has a trails counterpart at
      `packages/activesupport/src/test-case.ts`; `parity:api`'s `test_case.rb`
      row moves off 0%.
- [ ] `TaggedLogging`'s per-test heading reaches every suite through that
      receiver, not through per-project vitest setup files.
- [ ] `test-setup-test-case.ts` and the `cases/helper.ts` `beforeEach` are
      deleted, and `vitest.config.ts`'s `other` project no longer registers a
      TaggedLogging setup file.

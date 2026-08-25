---
title: "assert_nothing_raised wraps in UnexpectedError and _assert_nothing_raised_or_warn warns"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6460
claim: "2026-08-13T13:36:35Z"
assignee: "converge-async-sum-nil-identity-default"
blocked-by: null
closed-reason: null
---

## Context

`assert_nothing_raised` (activesupport/lib/active_support/testing/assertions.rb:49-53)
re-raises the block's error wrapped in `Minitest::UnexpectedError`, and
`_assert_nothing_raised_or_warn` (assertions.rb:281-294) rescues exactly that
class to emit the `tagged_logger` warning ("If you expected this exception, use
`assert_raises` as near to the code that raises as possible") before re-raising.

trails' `packages/activesupport/src/testing/assertions.ts` (landed in #6454)
ports both methods but neither wrapper nor warning: `assertNothingRaised` lets
the original error propagate and `_assertNothingRaisedOrWarn` has nothing to
rescue, so an unexpected raise inside `assertDifference` / `assertChanges` gives
no hint about which assertion swallowed the context.

## Converged shape

- An `UnexpectedError` error class wrapping the raised error, thrown by
  `assertNothingRaised`.
- `_assertNothingRaisedOrWarn` catches it, warns through the tagged logger
  (`packages/activesupport/src/tagged-logging.ts`) when `warn?`, and re-raises.
- Message text verbatim from assertions.rb:285-289.

## Acceptance criteria

- Both arms present; a test asserts the warning fires and the error still
  propagates.

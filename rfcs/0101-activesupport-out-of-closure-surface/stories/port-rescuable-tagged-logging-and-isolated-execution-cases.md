---
title: "port-rescuable-tagged-logging-and-isolated-execution-cases"
status: draft
updated: 2026-08-31
rfc: "0101-activesupport-out-of-closure-surface"
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

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`). Three unowned
out-of-closure files, 10 cases between them:

- `vendor/rails/activesupport/test/rescuable_test.rb:5`
  (`class RescuableTest`, 176 lines) — **4 missing**
  (`ActiveSupport::Rescuable#rescue_with_handler` and the `rescue_from`
  string/class/block resolution arms).
- `vendor/rails/activesupport/test/tagged_logging_test.rb:7`
  (`class TaggedLoggingTest`, 261 lines) — **3 stubs**.
- `vendor/rails/activesupport/test/isolated_execution_state_test.rb:5`
  (`class IsolatedExecutionStateTest`, 56 lines) — **3 stubs**.

Related but distinct: RFC 0098's `port-testing-tagged-logging-module` owns the
`ActiveSupport::Testing::TaggedLogging` _module_, not
`tagged_logging_test.rb`'s remaining cases; RFC 0099's
`converge-isolated-execution-state-delete-returns-value` is a call-argument
convergence, not a test port.

## Acceptance criteria

- All 10 cases implemented; none left `it.skip`.
- Rails test names verbatim.
- `pnpm parity:test` deltas non-negative.

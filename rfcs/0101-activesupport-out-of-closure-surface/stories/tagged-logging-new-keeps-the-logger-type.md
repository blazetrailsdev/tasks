---
title: "tagged-logging-new-keeps-the-logger-type"
status: ready
updated: 2026-10-19
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `TaggedLogging.new(logger)` returns a clone of the logger it was given (`logger.clone`), extended with `TaggedLogging` (`vendor/rails/v8.0.2/activesupport/lib/active_support/tagged_logging.rb:121-134`). The clone keeps the logger's own class and methods.

trails declares `new(logger: Logger): TaggedLogger` (`packages/activesupport/src/tagged-logging.ts:177`), so the result loses the type of the logger passed in.

A test that wraps its own logger can no longer reach that logger's members. activejob's `logging_test.rb` does `@logger = ActiveSupport::TaggedLogging.new(TestLogger.new)` and then calls `@logger.messages`. The generated port of that test reports 83 TS2339 errors ("'messages' does not exist on type 'TaggedLogger'").

## Acceptance criteria

- `TaggedLogging.new` is generic over the logger it is given and answers that logger's type extended with `TaggedLogger`, for example `new<L extends Logger>(logger: L): L & TaggedLogger`. The runtime is unchanged.
- `TaggedLogging.logger(...)` (`tagged_logging.rb:117`) keeps answering `Logger & TaggedLogger`.
- A trails test wraps a `Logger` subclass with an extra method and calls that method on the result. The test type-checks and passes.

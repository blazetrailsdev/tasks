---
title: "log-subscriber-test-ports-mock-semantic-logger"
status: draft
updated: 2026-10-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

# Port MockSemanticLogger in the LogSubscriber non-numeric-levels test

## Context

Rails' `test_subscribe_log_level_with_non_numeric_levels` (`vendor/rails/v8.0.2/activesupport/test/log_subscriber_test.rb:175-197`) builds a `MockSemanticLogger < MockLogger` whose `level` reader answers `LEVELS[super]` (`[:debug, :info]`), i.e. a Symbol level the way the semantic_logger gem does. trails' `packages/activesupport/src/log-subscriber.test.ts` ("subscribe log level with non numeric levels") uses a plain shared `MockLogger`, so the non-numeric arm is never exercised. Surfaced on trails#9115.

## Acceptance criteria

- [ ] The test defines `MockSemanticLogger extends MockLogger` with `LEVELS = [":debug", ":info"]` and a `level` getter answering `LEVELS[super.level]`, and drives `setLogger` with it.
- [ ] `LogSubscriber`'s level checks pass the test, fixed in the implementation where they assume a numeric level.

---
title: "insert_all/upsert_all log message includes model name (SQL-log capture)"
status: claimed
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-20T22:07:27Z"
assignee: "insert-all-log-message-model-name"
blocked-by: null
---

## Context

`packages/activerecord/src/insert-all.test.ts` has 4 tests gated correctly to
their Rails feature (`insert_conflict_target` / `insert_on_duplicate_update`)
but still `ctx.skip()`-pending because trails lacks a SQL-log capture assertion
(`capture_log_output` in Rails):

- "insert logs message including model name"
- "insert all logs message including model name"
- "upsert logs message including model name"
- "upsert all logs message including model name"

Rails: `insert_all_test.rb` (`test_insert_logging_includes_model_name` family).
The cited tracking story `d2-insert-all-canonical-models` is closed (done) but
these were never implemented.

## Acceptance criteria

- [ ] A test helper captures the emitted SQL log line (model name + statement)
      equivalent to Rails' `capture_log_output` / `assert_match`.
- [ ] The 4 tests assert the logged message includes the model name and run on
      their gated adapters (drop `ctx.skip()`).
- [ ] `test:compare --package activerecord` delta non-negative; test names
      unchanged.

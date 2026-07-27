---
title: "Port ddl_helper.rb, async_helper.rb, fake_adapter.rb"
status: done
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["move-test-helpers-to-support-dir"]
deps-rfc: []
est-loc: 350
priority: 55
pr: 5401
claim: "2026-07-27T13:09:07Z"
assignee: "port-missing-support-helpers"
blocked-by: null
closed-reason: null
---

## Context

Three `vendor/rails/activerecord/test/support/*.rb` helpers have **no trails
file at all** — verified by grepping for their methods across
`packages/activerecord/src` (all return zero non-test hits):

- `ddl_helper.rb` (10 lines) — `DdlHelper#with_example_table(connection,
table_name, definition)`: creates a table, yields, drops it in `ensure`.
  No `withExampleTable` exists in trails.
- `async_helper.rb` (15 lines) — `AsyncHelper#assert_async_equal(expected,
async_result)`: asserts the value is an `ActiveRecord::Promise` and unwraps
  it. No `assertAsyncEqual` exists.
- `fake_adapter.rb` (42 lines) — `FakeActiveRecordAdapter`, registered
  suite-wide by `cases/helper.rb:46`
  (`ActiveRecord::ConnectionAdapters.register("fake", ...)`). trails builds a
  fake adapter ad hoc inside `json-serialization.test.ts` and
  `connection-adapters/postgresql/schema-statements-class.test.ts` instead of
  having one registered support file.

See this RFC's README for the target layout and the A-D disposition.
Assumes `move-test-helpers-to-support-dir` has landed.

## Acceptance criteria

- Port all three as `support/ddl-helper.ts`, `support/async-helper.ts`,
  `support/fake-adapter.ts`, with method names matching Rails
  (`withExampleTable`, `assertAsyncEqual`, `FakeActiveRecordAdapter`).
- Register the fake adapter the way `cases/helper.rb:45-46` does, via
  `connection-adapters.ts`'s register/resolve path, rather than per-test.
- Convert the existing ad-hoc fake-adapter test setups to the registered one;
  do NOT rename those tests.
- Ports must be faithful to the Rails bodies — `with_example_table`'s `ensure`
  drop and `assert_async_equal`'s nil arm both matter.
- Split if over 500 LOC: the fake adapter alone may justify its own story.

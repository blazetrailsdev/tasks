---
title: "Port test_case_test.rb's request, params and process tests (lines 223-750)"
status: draft
updated: 2026-09-27
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "port-actionpack-view-and-helper-test-fixtures",
    "test-case-missing-methods-and-arity",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb` is 1294 lines.
Its `TestCaseTest` class (`:8-1088`) holds 119 tests. `pnpm parity:test --package actioncontroller`
reports 84 of them missing and 11 as empty `it.skip` stubs in
`packages/actionpack/src/action-controller/controller/test-case.test.ts`.

Bucketed by Rails line, the first half is:

| Rails lines | Missing | Skipped |
| ----------- | ------- | ------- |
| 223-249     | 4       | 0       |
| 250-499     | 17      | 5       |
| 500-749     | 23      | 2       |

These are the `process` / `get` / `post` request tests: params, query string,
headers, session and flash kwargs, `xhr`, `as: :json`, file uploads and raw
bodies. They drive the controller actions defined in `TestController`
(`:12-219`).

Six more tests are in the right file under the wrong `describe`: trails nests
`process without flash`, `process with flash`, `process with session kwarg`,
`process merges session arg`, `merged session arg is retained across requests`
and `process with symbol method` under an invented `process helpers` block.

`pnpm parity:test` also reports four tests as misplaced here, and none of them
is. `query string` and `headers` are `TestController#test_query_string` /
`#test_headers` (`:81`, `:89`) — controller actions, removed by RFC 0167's
`ruby-extractor-counts-controller-test-actions` — whose names collide with real
actiondispatch tests. `assert generates` and `assert routing` (`:451`, `:459`)
are real and simply missing; the same-named tests in
`dispatch/routing-assertions.test.ts` are ports of
`dispatch/routing_assertions_test.rb:77,184` and stay where they are. RFC
0167's `test-compare-misplaced-ignores-other-packages-rails-names` fixes the
report.

## Acceptance criteria

- Every `TestCaseTest` test between `:223` and `:749` is ported in Rails order,
  under `describe("TestCaseTest")`, driving a ported `TestController`.
- The six wrong-describe tests move to the top level of `TestCaseTest`.
  `assert generates` and `assert routing` are ported here; no actiondispatch test
  file is edited.
- No test is renamed. Any test that fails exposes a port bug: fix it, or file it
  against the owning RFC and leave that one test `it.skip` with the story id.

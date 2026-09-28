---
title: "Port the skipped assertion, TestRequest, TestResponse and runner tests"
status: done
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8223
claim: "2026-09-28T17:33:56Z"
assignee: "port-assertion-and-test-request-response-skips"
blocked-by: null
closed-reason: null
---

## Context

Five small Rails files are either fully present as empty `it.skip` stubs or
absent:

| Rails test file                                        | State                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `controller/action_pack_assertions_test.rb`            | 30/44; 11 skips in `ActionPackAssertionsControllerTest` (`:146-493`), 3 in `ActionPackHeaderTest` (`:504-519`) |
| `dispatch/test_request_test.rb`                        | 8/11; 3 skips in `TestRequestTest` (`:6-94`)                                                                   |
| `dispatch/test_response_test.rb`                       | 1/5; 4 skips, and all 5 under the wrong `describe`                                                             |
| `controller/request/test_request_test.rb`              | absent; `ActionController::TestRequestTest` (`:7-37`), 5 tests                                                 |
| `controller/runner_test.rb`, `dispatch/runner_test.rb` | absent; 1 test each (`RunnerTest`)                                                                             |

All paths are under `vendor/rails/v8.0.2/actionpack/test/`. The runner tests
check that `ActionDispatch::Integration::Runner` delegates to a `Session`.

## Acceptance criteria

- Every skip stub is replaced by the Rails test body.
- The five `test_response_test.rb` tests sit under `describe("TestResponseTest")`.
- The three absent files exist at their convention paths
  (`controller/request/test-request.test.ts`, `controller/runner.test.ts`,
  `dispatch/runner.test.ts`) and report complete.

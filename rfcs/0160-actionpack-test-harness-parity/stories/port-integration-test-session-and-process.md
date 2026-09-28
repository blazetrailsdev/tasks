---
title: "Port integration_test.rb's Session and IntegrationProcessTest tests"
status: draft
updated: 2026-09-27
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "integration-session-delegated-readers-and-host-bang",
    "integration-process-splits-host-with-invented-ipv6-helper",
    "port-abstract-unit-routing-and-assertion-helpers",
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

`vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb` (1396 lines)
reports 25/92 in `pnpm parity:test --package actioncontroller`. This story takes
its first two thirds:

| Rails class                                    | Missing | Skipped |
| ---------------------------------------------- | ------- | ------- |
| `SessionTest` (`:8-128`)                       | 4       | 0       |
| `IntegrationTestTest` (`:130-167`)             | 0       | 1       |
| `RackLintIntegrationTest` (`:169-189`)         | 0       | 1       |
| `IntegrationTestUsesCorrectClass` (`:191-200`) | 1       | 0       |
| `IntegrationProcessTest` (`:202-665`)          | 28      | 0       |
| `MetalIntegrationTest` (`:667-743`)            | 0       | 1       |

`IntegrationProcessTest` covers `get`/`post`/`xhr`, redirects and
`follow_redirect!`, cookies across requests, `https!`, `host!`, and the
`status_message` / `body` / `path` readers.

`pnpm parity:test` reports `redirect` (`:367`) as misplaced in
`inspector.test.ts`. It is not: that is the port of
`dispatch/routing/inspector_test.rb:287`'s own `test_redirect`, a cross-package
name collision (RFC 0167's `test-compare-misplaced-ignores-other-packages-rails-names`).
The integration `redirect` test is missing and is ported here.

## Acceptance criteria

- Every test above is ported in Rails order under its Rails class, on top of
  `ActionDispatch::IntegrationTest.build_app` from the harness.
- The three skip stubs are real tests; `redirect` is ported here and the
  inspector test is left alone.
- The tests use Rails' assertions, not the invented integration helpers that
  `remove-invented-integration-test-assertions` deletes.

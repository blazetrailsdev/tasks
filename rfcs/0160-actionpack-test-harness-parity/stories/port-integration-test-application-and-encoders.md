---
title: "Port integration_test.rb's application, URL-option and request-encoder tests"
status: done
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-integration-test-session-and-process"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8233
claim: "2026-09-28T21:36:54Z"
assignee: "ar-typecheck-requires-unexported-package-json"
blocked-by: null
closed-reason: null
---

## Context

The remaining third of
`vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb`:

| Rails class                                               | Missing |
| --------------------------------------------------------- | ------- |
| `ApplicationIntegrationTest` (`:745-844`)                 | 8       |
| `EnvironmentFilterIntegrationTest` (`:846-877`)           | 1       |
| `ControllerWithHeadersMethodIntegrationTest` (`:879-901`) | 1       |
| `UrlOptionsIntegrationTest` (`:903-985`)                  | 5       |
| `HeadWithStatusActionIntegrationTest` (`:987-1016`)       | 1       |
| `IntegrationWithRoutingTest` (`:1018-1053`)               | 1       |
| `IntegrationRequestsWithoutSetup` (`:1055-1082`)          | 1       |
| `IntegrationRequestsWithSessionSetup` (`:1084-1093`)      | 1       |
| `IntegrationRequestEncodersTest` (`:1095-1273`)           | 10      |
| `IntegrationFileUploadTest` (`:1275-1311`)                | 1       |
| `PageDumpIntegrationTest` (`:1313-1396`)                  | 3       |

`IntegrationRequestEncodersTest` exercises `RequestEncoder`
(`action_dispatch/testing/request_encoder.rb`, trails
`action-dispatch/testing/request-encoder.ts`) through `as: :json` and a
registered custom encoder. `PageDumpIntegrationTest` exercises
`TestHelpers::PageDumpHelper` (`testing/test_helpers/page_dump_helper.rb`).

`IntegrationFileUploadTest::IntegrationController#test_file_upload` (`:1278`) is
a controller action, not a test; `ruby-extractor-counts-controller-test-actions`
drops it from the denominator.

## Acceptance criteria

- Every test above is ported in Rails order under its Rails class.
- `pnpm parity:test --package actioncontroller` reports
  `controller/integration_test.rb` with 0 missing and 0 skipped.

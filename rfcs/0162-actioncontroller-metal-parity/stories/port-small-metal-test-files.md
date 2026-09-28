---
title: "Port the small unported metal test files"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["port-actionpack-abstract-unit-test-support", "metal-invented-registries-fold-into-rails-state"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Eight Rails files under `vendor/rails/v8.0.2/actionpack/test/controller/` have
no trails file:

| Rails file                       | Tests                       | Class(es)                                                                             |
| -------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| `logging_test.rb`                | 3                           | `LoggingTest` (`:21-33`)                                                              |
| `parameter_encoding_test.rb`     | 5 real (+4 phantom actions) | `ParameterEncodingTest` (`:29-58`)                                                    |
| `parameters_integration_test.rb` | 2                           | `ActionControllerParametersIntegrationTest`                                           |
| `params_parse_test.rb`           | 1                           | `ParamsParseTest`                                                                     |
| `permitted_params_test.rb`       | 2                           | `ActionControllerPermittedParamsTest`                                                 |
| `rate_limiting_test.rb`          | 5                           | `RateLimitingTest` (`:27-75`)                                                         |
| `show_exceptions_test.rb`        | 9                           | `ShowExceptionsTest`, `…OverriddenTest`, `…FormatsTest`, `ShowFailsafeExceptionsTest` |
| `webservice_test.rb`             | 7                           | `WebServiceTest` (`:37-101`) — XML/JSON params parsed into `params`                   |

## Acceptance criteria

- Each file exists at its convention path and ports every Rails test in order.
- All eight report complete in `pnpm parity:test --package actioncontroller`
  (apart from the phantom rows RFC 0167 (gates) removes).

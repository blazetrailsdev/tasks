---
title: "Port test_case_test.rb's request-reset, upload and class-naming tests (lines 750-1294)"
status: draft
updated: 2026-09-27
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-test-case-test-requests-and-params", "port-actionpack-view-and-helper-test-fixtures"]
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

The second half of
`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb`:

| Rails lines / class                                         | Missing | Skipped |
| ----------------------------------------------------------- | ------- | ------- |
| `TestCaseTest` 750-999                                      | 36      | 2       |
| `TestCaseTest` 1000-1088                                    | 4       | 2       |
| `ResponseDefaultHeadersTest` (`:1090`)                      | 2       | 0       |
| `BarControllerTest`, `…WithExplicitRouteSet` (`:1164-1185`) | 2       | 0       |
| `InferringClassNameTest` (`:1187`)                          | 3       | 0       |
| `ManuallySet{,Symbol,String}NameTest` (`:1206-1228`)        | 3       | 0       |
| `NamedRoutesControllerTest` (`:1230`)                       | 1       | 0       |
| `AnonymousControllerTest` (`:1242`)                         | 1       | 0       |
| `RoutingDefaultsTest` (`:1265`)                             | 2       | 0       |

The `TestCaseTest` tail covers state reset between requests (params, filtered
parameters, raw post, content length, path params, protocol), the `format:`
kwarg, client-side cookie state, and uploads through `Rack::Test::UploadedFile`
and `fixture_file_upload` (`:940-948`, reading `fixtures/multipart`). The
class-naming tests cover `tests SomeController` and `controller_class` inference.

## Acceptance criteria

- Every test listed above is ported in Rails order under its Rails class name.
- `pnpm parity:test --package actioncontroller` reports
  `controller/test_case_test.rb` with 0 missing, 0 skipped and 0 wrong describe,
  apart from the 17 phantom action rows that
  `ruby-extractor-counts-controller-test-actions` removes.

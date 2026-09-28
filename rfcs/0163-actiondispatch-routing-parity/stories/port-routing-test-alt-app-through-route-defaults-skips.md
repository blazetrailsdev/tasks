---
title: "Port dispatch/routing_test.rb's skipped tests from TestAltApp to TestRouteDefaults"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-routing-test-mapper-skips-part-1"]
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

`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` after
`TestRoutingMapper`, lines 3973-4899 — 36 empty skip stubs and 1 missing test:

| Class                                          | Skipped | Missing |
| ---------------------------------------------- | ------- | ------- |
| `TestAltApp` (`:3973`)                         | 3       |         |
| `TestNamespaceWithControllerOption` (`:4079`)  | 10      |         |
| `TestHttpMethods` (`:4222`)                    |         | 1       |
| `TestMultipleNestedController` (`:4315`)       | 1       |         |
| `TestRedirectInterpolation` (`:4373`)          | 3       |         |
| `TestConstraintsAccessingParameters` (`:4415`) | 1       |         |
| `TestGlobRoutingMapper` (`:4435`)              | 3       |         |
| `TestNamedRouteUrlHelpers`                     | 1       |         |
| `TestInvalidUrls`                              | 3       |         |
| `TestOptionalRootSegments`                     | 1       |         |
| `TestPortConstraints`                          | 4       |         |
| `TestFormatConstraints`                        | 4       |         |
| `TestRouteDefaults`                            | 2       |         |

## Acceptance criteria

- Each stub is replaced by the Rails body and `TestHttpMethods` is ported,
  under the Rails class names.

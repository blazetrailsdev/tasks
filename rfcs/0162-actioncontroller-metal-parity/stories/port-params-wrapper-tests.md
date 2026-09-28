---
title: "Port params_wrapper_test.rb and api/params_wrapper_test.rb under Rails names"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["port-wrap-parameters-class-macro", "action-controller-barrel-and-header-helpers-extra-surface"]
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

`vendor/rails/v8.0.2/actionpack/test/controller/params_wrapper_test.rb` (438
lines) has 30 tests: `ParamsWrapperTest` (`:19-272`, 23),
`NamespacedParamsWrapperTest` (`:274-360`, 4),
`AnonymousControllerParamsWrapperTest` (`:362-392`, 2) and
`IrregularInflectionParamsWrapperTest` (`:394`, 1). `pnpm parity:test` reports
0/30 matched and 23 extra:
`packages/actionpack/src/action-controller/controller/params-wrapper.test.ts`
tests the invented `wrapParameters(params, name, include, exclude)` helper
(`describe("wrapParameters")`, `it("creates config with key")`) rather than
porting the Rails file. `api/params_wrapper_test.rb` (1 test,
`ParamsWrapperForApiTest`) is absent.

`port-wrap-parameters-class-macro` (RFC 0141) ports the class macro these tests
call.

## Acceptance criteria

- `params-wrapper.test.ts` ports the Rails file, all 30 tests in Rails order;
  the invented-helper tests are deleted with the helper.
- `controller/api/params-wrapper.test.ts` ports the API test.
- Both report complete with no extra.

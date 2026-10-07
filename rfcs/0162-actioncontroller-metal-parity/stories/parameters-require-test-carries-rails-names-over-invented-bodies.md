---
title: "ParametersRequireTest carries Rails names over invented bodies"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/controller/required-params.test.ts`
matches every name in `ParametersRequireTest`
(`vendor/rails/v8.0.2/actionpack/test/controller/required_params_test.rb:49-112`),
but several bodies do not mirror Rails':

- `require array when all required params are present` (`:66-73`) and
  `require array when a required param is missing` (`:75-81`) call
  `require([...])` on a flat hash; Rails chains
  `.require(:person).require([:first_name, :title])` and asserts
  `assert_kind_of Array`.
- `value params` (`:83-88`) asserts `params.get("foo")`; Rails asserts
  `params.values`, `has_value?("cinco")` and `value?("cinco")`.
- `to_param works like in a Hash` (`:90-99`) and `to_query works like in a Hash`
  (`:101-111`) drop the `{ root: Parameters }` arm.
- The file asserts through `expect(...)`, not Rails' `assert_*`.

## Acceptance criteria

- Each `ParametersRequireTest` body mirrors its Rails body line for line, with
  Rails' assertions.
- `pnpm parity:test:assertions` shows no mismatch for the file.

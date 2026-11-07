---
title: "Parameters#fetch's hash-default overload types a stored scalar as Parameters"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9836 added `fetch(key: string, defaultValue: Record<string, unknown>): Parameters`
to `Parameters` (`packages/actionpack/src/action-controller/metal/strong-parameters.ts`, `fetch`).
Rails' `fetch` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`, `def fetch`)
returns `convert_value_to_parameters` of the stored value, which returns a stored scalar or array
unchanged (`strong_parameters.rb`, `def convert_value_to_parameters`). So with a hash default,
`fetch("post", {})` can answer a String when the request sends `post=x`, while the overload's
type says `Parameters`. `strong-parameters.trails.test.ts` ("Parameters#fetch with a hash default")
asserts that runtime arm.

The type is this narrow so that the no-attributes scaffold's `new Post(this.postParams())`
type-checks with no cast.

## Acceptance criteria

- The hash-default overload's return type admits every value `convert_value_to_parameters`
  can return: `Parameters`, an array of converted values, or a stored scalar.
- The no-attributes scaffold still compiles with no cast. Either the model constructor accepts
  the honest type, or the generator emits a narrowing that Rails' template implies.
- The scaffold generator tests and the trails `fetch` test stay green.

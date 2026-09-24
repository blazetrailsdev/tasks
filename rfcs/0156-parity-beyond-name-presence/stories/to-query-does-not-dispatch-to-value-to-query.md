---
title: "to-query-does-not-dispatch-to-value-to-query"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Hash#to_query` dispatches `value.to_query(namespace ? "#{namespace}[#{key}]" : key)`
for every value (`activesupport/lib/active_support/core_ext/object/to_query.rb`,
`class Hash`), so a value class with its own `to_query(key)` — `ActionController::Parameters`
(`actionpack/lib/action_controller/metal/strong_parameters.rb:381-383`) — nests under the
namespace. trails' `buildQueryParts` (`packages/activesupport/src/hash-utils.ts`)
dispatches only plain objects / Maps / Arrays and renders anything else as
`key=toParam(value)`, which loses the namespace. `HashWithIndifferentAccess#toQuery()`
(`packages/activesupport/src/hash-with-indifferent-access.ts`) also drops Rails'
`namespace` parameter.

So `required_params_test.rb:93-94` / `:105-106` (`{ root: Parameters.new(...).permit! }.to_query`)
cannot be ported; trails#8041 ports the other two assertions of
`to_param works like in a Hash` and `to_query works like in a Hash`.

## Acceptance criteria

- `buildQueryParts` dispatches to a value's own `toQuery(key)` as Ruby's `value.to_query(key)`
  does, and `HashWithIndifferentAccess#toQuery` takes `namespace` like `Hash#to_query`.
- The `{ root: params }` assertions are added to both tests in
  `packages/actionpack/src/action-controller/controller/required-params.test.ts`.

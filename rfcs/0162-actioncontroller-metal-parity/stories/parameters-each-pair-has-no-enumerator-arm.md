---
title: "Parameters#each_pair, #each_value and #each_key have no to_enum arm"
status: draft
updated: 2026-10-06
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

Rails' `ActionController::Parameters#each_pair`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:402-409`)
opens with `return to_enum(__callee__) unless block_given?`, and `each_value`
(`:414-420`) and `each_key` do the same. trails' `eachPair` / `eachValue` /
`eachKey` (`packages/actionpack/src/action-controller/metal/strong-parameters.ts`)
take a required block and have no enumerator arm.

`ParametersAccessorsTest` "parameters are not equal to the hash"
(`vendor/rails/v8.0.2/actionpack/test/controller/parameters/equality_test.rb:22-25`)
is `@hash = @params.each_pair.to_h`; its port in
`packages/actionpack/src/action-controller/controller/parameters/equality.test.ts`
collects the pairs through a block instead.

## Acceptance criteria

- [ ] `eachPair`, `eachValue` and `eachKey` port the `to_enum` arm with the
      settled trails enumerator idiom and `rbBlockGivenP`.
- [ ] The equality test builds its hash from `params.eachPair()` with no block,
      as Rails does.

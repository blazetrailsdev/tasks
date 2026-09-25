---
title: "strong-parameters-fetch-raises-keyerror-not-parameter-missing"
status: draft
updated: 2026-09-25
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ActionController::Parameters#fetch`
(`actionpack/lib/action_controller/metal/strong_parameters.rb:820-831`) runs
`@parameters.fetch(key) { block_given? ? yield : args.fetch(0) { raise ActionController::ParameterMissing.new(key, @parameters.keys) } }`
and passes the result through `convert_value_to_parameters`. A missing key with no default and no block raises
`ActionController::ParameterMissing`, not `KeyError`, and the block arm yields.

trails' port, `packages/actionpack/src/action-controller/metal/strong-parameters.ts` `fetch`
(near line 480), throws `KeyError("key not found: \"<key>\"")` on a miss. It has no block arm, and it skips
`convertValueToParameters` on the found-value arm (it returns `this.get(key)`). Surfaced while
reviewing trails#8119 (ruby-compat-error-initialize-attributes).

## Acceptance criteria

- [ ] A miss with no default raises `ParameterMissing.new(key, @parameters.keys)`, which is Rails' error class and message.
- [ ] The block arm yields, as `strong_parameters.rb:823-824` does.
- [ ] The found value goes through `convertValueToParameters`, as the Rails body does.
- [ ] The Rails `parameters_permit_test.rb` / `parameters_access_test.rb` `fetch` tests are ported verbatim.

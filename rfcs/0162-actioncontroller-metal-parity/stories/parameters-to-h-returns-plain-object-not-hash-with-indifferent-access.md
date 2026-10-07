---
title: "Parameters#to_h returns a plain object, not a HashWithIndifferentAccess"
status: closed
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "duplicate of parameters-to-h-returns-a-plain-object-not-hash-with-indifferent-access"
---

## Context

`ActionController::Parameters#to_h`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:331-337`)
returns `convert_parameters_to_hashes(@parameters, :to_h, &block)`, an
`ActiveSupport::HashWithIndifferentAccess`. `to_hash` (`:351-357`) is
`to_h.to_hash`, a plain `Hash`, and `to_unsafe_h` (`:385-387`) is again a
`HashWithIndifferentAccess`.

trails' `Parameters#toH`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:482-496`)
returns a plain `Record<string, unknown>`: `_convertParametersToHashes`
(`:637-650`) rebuilds every `Hash` as an object literal, and the block arm of
`toH` is applied to the top level only, where Rails threads `&block` through
`convert_parameters_to_hashes`.

`ParametersMutatorsTest` "to_h returns a ActiveSupport::HashWithIndifferentAccess"
(`vendor/rails/v8.0.2/actionpack/test/controller/parameters/mutators_test.rb:198-202`)
asserts `assert_instance_of ActiveSupport::HashWithIndifferentAccess, params_hash`
and fails against the port. It is parked `it.skip` under a `BLOCKED:` line naming
this story in
`packages/actionpack/src/action-controller/controller/parameters/mutators.test.ts`.

## Acceptance criteria

- [ ] `Parameters#toH` and `#toUnsafeH` return a `HashWithIndifferentAccess`,
      and `#toHash` a plain hash, as `strong_parameters.rb:331-387` do.
- [ ] `convert_parameters_to_hashes` is ported at its Rails name with its
      `&block` parameter (`strong_parameters.rb:1114-1128`).
- [ ] The parked test in `mutators.test.ts` is un-skipped with its Rails body
      and passes; `toH` callers that read the result as a plain object are
      converted.
